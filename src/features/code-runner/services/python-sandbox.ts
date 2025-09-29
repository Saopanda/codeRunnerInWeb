import {
  useCodeRunnerStore,
  type CodeOutput,
  type SandboxConfig,
} from '../stores/code-runner-store'
import {
  getPyodideConfig,
  preloadPyodideResources,
  checkPyodideResources,
} from './pyodide-loader'

export interface PythonSandboxConfig extends SandboxConfig {
  pythonVersion: string
  enabledPackages: string[]
  memoryLimit: number
  maxExecutionTime: number
  maxRecursionDepth: number
  errorReporting: string
}

export class PythonSandboxManager {
  private pyodide: any = null // eslint-disable-line @typescript-eslint/no-explicit-any
  private worker: Worker | null = null
  private readyPromise: Promise<void> | null = null
  private resolveReady: (() => void) | null = null
  private executionId: string | null = null
  private timeoutId: number | null = null
  private startTime: number = 0
  private isExecuting: boolean = false
  private isInitialized: boolean = false

  // Python安全限制在 Worker 内实现

  private readonly PYTHON_ALLOWED_PACKAGES = [
    'numpy',
    'pandas',
    'matplotlib',
    'scipy',
    'sklearn',
    'seaborn',
    'math',
    'random',
    'datetime',
    'json',
    're',
    'collections',
    'itertools',
    'functools',
    'operator',
    'string',
    'decimal',
    'fractions',
    'statistics',
    'plotly',
    'requests',
  ]

  // 科学计算包列表（用于未来扩展）
  // private readonly SCIENTIFIC_PACKAGES = [
  //   'numpy', 'pandas', 'matplotlib', 'scipy', 'sklearn', 'seaborn', 'plotly'
  // ]

  private loadedPackages: Set<string> = new Set()

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.worker) return

    // 检查Pyodide资源可用性
    const resourcesAvailable = await checkPyodideResources()
    if (!resourcesAvailable) {
      this.addOutput({
        type: 'error',
        message: 'Pyodide资源不可用，请检查网络连接或本地资源',
        source: 'error',
      })
      throw new Error('Pyodide资源不可用')
    }

    // 预加载Pyodide资源
    await preloadPyodideResources()

    this.addOutput({
      type: 'info',
      message: '正在初始化 Python 环境...',
      source: 'system',
    })

    // 创建 Worker 承载 Pyodide
    this.worker = new Worker(new URL('./python-worker.ts', import.meta.url), {
      type: 'module',
    })
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve
    })

    this.worker.onmessage = (ev: MessageEvent) => {
      const data = ev.data as { type: string; payload?: unknown } | null
      if (!data || !data.type) return
      switch (data.type) {
        case 'READY': {
          this.isInitialized = true
          this.addOutput({
            type: 'info',
            message: 'Python 环境初始化完成',
            source: 'system',
          })
          this.resolveReady?.()
          this.resolveReady = null
          break
        }
        case 'OUTPUT': {
          const p = data.payload as {
            outputType: 'log' | 'error' | 'warn' | 'info'
            message: string
          }
          this.addOutput({
            type: p.outputType,
            message: p.message,
            source: p.outputType === 'error' ? 'error' : 'console',
          })
          break
        }
        case 'RESULT': {
          const p = data.payload as { executionId: string; result: string }
          if (p.executionId === this.executionId) {
            this.addOutput({
              type: 'log',
              message: `返回值: ${p.result}`,
              source: 'console',
            })
          }
          break
        }
        case 'ERROR': {
          const p = data.payload as { executionId?: string; error: string }
          this.addOutput({
            type: 'error',
            message: `Python 执行错误: ${p.error}`,
            source: 'error',
          })
          if (!p.executionId || p.executionId === this.executionId) {
            this.cleanupExecution()
          }
          break
        }
        case 'COMPLETE': {
          const p = data.payload as { executionId: string }
          if (p.executionId === this.executionId) {
            this.addOutput({
              type: 'info',
              message: 'Python 代码执行完成',
              source: 'system',
            })
            this.cleanupExecution()
          }
          break
        }
        case 'PACKAGE_LOADED': {
          const p = data.payload as { name: string }
          this.loadedPackages.add(p.name)
          this.addOutput({
            type: 'info',
            message: `包加载完成: ${p.name}`,
            source: 'system',
          })
          break
        }
      }
    }

    this.worker.onerror = (e) => {
      this.addOutput({
        type: 'error',
        message: `Python Worker 错误: ${e.message}`,
        source: 'error',
      })
    }

    const config = getPyodideConfig()
    this.worker.postMessage({
      type: 'INIT',
      payload: {
        pyodideConfig: config as unknown as {
          indexURL: string
          fullStdLib?: boolean
          packages?: string[]
          packageBaseUrl?: string
        },
        maxRecursionDepth: 1000,
      },
    })

    await this.readyPromise
  }

  // Worker 终止与重建
  private terminateWorker(): void {
    if (this.worker) {
      try {
        this.worker.terminate()
      } catch {
        /* ignore */
      }
    }
    this.worker = null
    this.isInitialized = false
    this.readyPromise = null
    this.resolveReady = null
  }

  // Worker 模式下不再使用

  public async executeCode(code: string, config: SandboxConfig): Promise<void> {
    // 防止并发执行
    if (this.isExecuting) {
      this.addOutput({
        type: 'warn',
        message: 'Python 代码正在执行中，请等待完成后再试',
        source: 'system',
      })
      return
    }

    this.isExecuting = true

    try {
      // 停止当前执行（如果有）
      this.stopExecution()

      // 确保Python环境已初始化
      if (!this.isInitialized) {
        await this.initialize()
      }

      this.executionId = `python-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.startTime = Date.now()

      // 更新执行状态
      const store = useCodeRunnerStore.getState()
      store.setExecutionState({
        isRunning: true,
        executionId: this.executionId,
        startTime: this.startTime,
        executionTime: null,
      })

      // 清空之前的输出
      store.clearOutputs()

      // 设置执行超时（通过终止 Worker 实现真正中断）
      this.timeoutId = window.setTimeout(() => {
        this.addOutput({
          type: 'error',
          message: 'Python 代码执行超时',
          source: 'timeout',
        })
        this.terminateWorker()
        this.cleanupExecution()
      }, config.timeout || 10000)

      // 代码基本校验
      const cleanCode = (code || '').trim()
      if (!cleanCode) {
        this.addOutput({
          type: 'error',
          message: 'Python代码不能为空',
          source: 'error',
        })
        this.cleanupExecution()
        return
      }
      if (this.hasUnclosedQuotes(cleanCode)) {
        this.addOutput({
          type: 'error',
          message: 'Python代码语法错误：存在未闭合的引号',
          source: 'error',
        })
        this.cleanupExecution()
        return
      }

      this.addOutput({
        type: 'info',
        message: '正在执行 Python 代码...',
        source: 'system',
      })

      // 将执行请求发送到 Worker（Worker 内部使用 runPythonAsync）
      this.worker?.postMessage({
        type: 'EXECUTE',
        payload: {
          executionId: this.executionId,
          code: cleanCode,
          timeoutMs: config.timeout || 10000,
        },
      })
    } catch (error) {
      this.addOutput({
        type: 'error',
        message: `Python 执行错误: ${this.formatPythonError(error)}`,
        source: 'error',
      })
      this.cleanupExecution()
      throw error
    } finally {
      this.isExecuting = false
    }
  }

  // Worker 模式下不再使用

  private formatPythonOutput(value: any): string {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      if (value === null) return 'None'
      if (value === undefined) return 'undefined'
      if (typeof value === 'string') return `"${value}"`
      if (typeof value === 'number') return value.toString()
      if (typeof value === 'boolean') return value ? 'True' : 'False'
      if (Array.isArray(value))
        return `[${value.map((v) => this.formatPythonOutput(v)).join(', ')}]`
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2)
      }
      return String(value)
    } catch (error) {
      return `[无法格式化输出: ${error instanceof Error ? error.message : '未知错误'}]`
    }
  }

  private hasUnclosedQuotes(code: string): boolean {
    const lines = code.split('\n')
    let inSingleQuote = false
    let inDoubleQuote = false
    let inTripleQuote = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      let j = 0

      while (j < line.length) {
        const char = line[j]

        if (inTripleQuote) {
          if (
            line.substring(j, j + 3) === '"""' ||
            line.substring(j, j + 3) === "'''"
          ) {
            inTripleQuote = false
            j += 3
          } else {
            j++
          }
          continue
        }

        if (
          char === '"' &&
          j + 2 < line.length &&
          line[j + 1] === '"' &&
          line[j + 2] === '"'
        ) {
          inTripleQuote = true
          j += 3
          continue
        }

        if (
          char === "'" &&
          j + 2 < line.length &&
          line[j + 1] === "'" &&
          line[j + 2] === "'"
        ) {
          inTripleQuote = true
          j += 3
          continue
        }

        if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote
          j++
          continue
        }

        if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote
          j++
          continue
        }

        j++
      }
    }

    return inSingleQuote || inDoubleQuote || inTripleQuote
  }

  private formatPythonError(error: any): string {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (error instanceof Error) {
      // 尝试解析Python错误信息
      const message = error.message

      // 检查是否是Python语法错误
      if (message.includes('SyntaxError')) {
        return this.formatSyntaxError(message)
      }

      // 检查是否是Python运行时错误
      if (
        message.includes('NameError') ||
        message.includes('TypeError') ||
        message.includes('ValueError') ||
        message.includes('AttributeError')
      ) {
        return this.formatRuntimeError(message)
      }

      // 检查是否是导入错误
      if (
        message.includes('ImportError') ||
        message.includes('ModuleNotFoundError')
      ) {
        return this.formatImportError(message)
      }

      return message
    }

    if (typeof error === 'string') {
      return error
    }

    return '未知错误'
  }

  private formatSyntaxError(message: string): string {
    // 解析语法错误信息
    const lines = message.split('\n')
    if (lines.length >= 2) {
      const errorLine = lines[0]
      const codeLine = lines[1] || ''
      const pointer = lines[2] || ''

      return `语法错误: ${errorLine}\n代码: ${codeLine}\n位置: ${pointer}`
    }
    return `语法错误: ${message}`
  }

  private formatRuntimeError(message: string): string {
    // 解析运行时错误信息
    const lines = message.split('\n')
    if (lines.length >= 2) {
      const errorType = lines[0].split(':')[0]
      const errorMessage = lines[0].split(':').slice(1).join(':').trim()
      const traceback = lines.slice(1).join('\n')

      return `${errorType}: ${errorMessage}\n${traceback}`
    }
    return `运行时错误: ${message}`
  }

  private formatImportError(message: string): string {
    // 解析导入错误信息
    if (message.includes('No module named')) {
      const moduleName = message.match(/No module named '([^']+)'/)?.[1]
      if (moduleName) {
        return `模块导入错误: 找不到模块 '${moduleName}'\n提示: 该模块可能不在允许的包列表中`
      }
    }
    return `导入错误: ${message}`
  }

  // Worker 模式下不再使用

  private cleanupExecution(): void {
    // 清除超时
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // 清除执行ID
    this.executionId = null
    this.startTime = 0

    // 更新执行状态
    const store = useCodeRunnerStore.getState()
    store.setExecutionState({
      isRunning: false,
      isPaused: false,
      executionId: null,
      startTime: null,
      timeoutId: null,
    })
  }

  private addOutput(output: Omit<CodeOutput, 'id' | 'timestamp'>) {
    const store = useCodeRunnerStore.getState()
    store.addOutput(output)
  }

  public stopExecution(): void {
    if (this.executionId) {
      this.terminateWorker()
      this.cleanupExecution()
      this.addOutput({
        type: 'info',
        message: `Python 执行已停止 (ID: ${this.executionId})`,
        source: 'system',
      })
    }
  }

  public destroy(): void {
    this.stopExecution()
    this.terminateWorker()
    this.pyodide = null
    this.isInitialized = false
    this.isExecuting = false
  }

  public getStatus() {
    return {
      isRunning: this.executionId !== null,
      isReady: this.isInitialized,
      executionId: this.executionId,
      startTime: this.startTime,
      hasPyodide: this.pyodide !== null,
    }
  }

  /**
   * 加载Python包
   */
  public async loadPackage(packageName: string): Promise<boolean> {
    if (!this.worker) {
      throw new Error('Python环境未初始化')
    }
    try {
      this.addOutput({
        type: 'info',
        message: `正在加载包: ${packageName}`,
        source: 'system',
      })
      this.worker.postMessage({
        type: 'LOAD_PACKAGE',
        payload: { name: packageName },
      })
      return true
    } catch (error) {
      this.addOutput({
        type: 'error',
        message: `包加载失败: ${packageName} - ${error instanceof Error ? error.message : '未知错误'}`,
        source: 'error',
      })
      return false
    }
  }

  /**
   * 获取可用的Python包列表
   */
  public getAvailablePackages(): string[] {
    return this.PYTHON_ALLOWED_PACKAGES
  }

  /**
   * 检查包是否被允许
   */
  public isPackageAllowed(packageName: string): boolean {
    return this.PYTHON_ALLOWED_PACKAGES.includes(packageName)
  }

  /**
   * 动态加载科学计算库
   */
  public async loadScientificPackage(packageName: string): Promise<boolean> {
    if (!this.isPackageAllowed(packageName)) {
      this.addOutput({
        type: 'error',
        message: `包 '${packageName}' 不在允许的包列表中`,
        source: 'error',
      })
      return false
    }

    if (this.loadedPackages.has(packageName)) {
      return true
    }

    try {
      this.addOutput({
        type: 'info',
        message: `正在加载 ${packageName}...`,
        source: 'system',
      })

      await this.pyodide.loadPackage(packageName)
      this.loadedPackages.add(packageName)

      this.addOutput({
        type: 'info',
        message: `${packageName} 加载完成`,
        source: 'system',
      })

      return true
    } catch (error) {
      this.addOutput({
        type: 'error',
        message: `${packageName} 加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
        source: 'error',
      })
      return false
    }
  }

  /**
   * 获取已加载的包列表
   */
  public getLoadedPackages(): string[] {
    return Array.from(this.loadedPackages)
  }

  /**
   * 检查包是否已加载
   */
  public isPackageLoaded(packageName: string): boolean {
    return this.loadedPackages.has(packageName)
  }
}

// 单例实例
export const pythonSandboxManager = new PythonSandboxManager()
