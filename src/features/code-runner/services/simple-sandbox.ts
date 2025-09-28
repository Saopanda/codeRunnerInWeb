import { useCodeRunnerStore, type CodeOutput, type SandboxConfig } from '../stores/code-runner-store'
import { typescriptCompiler } from './typescript-compiler'
import { performanceMonitor } from './performance-monitor'
import { securityManager } from '../security/security-manager'
import { phpSandboxManager } from './php-sandbox'

export class SimpleSandboxManager {
  private executionId: string | null = null
  private timeoutId: NodeJS.Timeout | null = null
  private startTime: number | 0 = 0

  public async executeCode(code: string, config: SandboxConfig, language: 'javascript' | 'typescript' | 'php' = 'javascript'): Promise<void> {
    if (this.executionId) {
      throw new Error('已有代码正在执行中')
    }

    this.executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.startTime = Date.now()

    // 开始性能监控
    const stopExecutionMonitoring = performanceMonitor.startExecutionMonitoring(code, language)

    // 更新执行状态
    const store = useCodeRunnerStore.getState()
    store.setExecutionState({
      isRunning: true,
      executionId: this.executionId,
      startTime: this.startTime,
      executionTime: null // 重置当前执行时间
    })

    // 清空之前的输出
    store.clearOutputs()

    let codeToExecute = code

    // 如果是 PHP，使用 PHP 沙箱
    if (language === 'php') {
      try {
        await phpSandboxManager.executeCode(code, config)
        // 执行完成，停止性能监控并更新状态
        const executionTime = stopExecutionMonitoring()

        // 更新执行状态
        const store = useCodeRunnerStore.getState()
        store.setExecutionState({
          isRunning: false,
          executionTime: executionTime,
          firstExecutionTime: store.executionState.firstExecutionTime || executionTime
        })

        this.stopExecution()
        return
      } catch (error) {
        stopExecutionMonitoring() // 停止性能监控
        this.addOutput({
          type: 'error',
          message: `PHP 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
          source: 'error'
        })
        this.stopExecution()
        return
      }
    }

    // 如果是 TypeScript，先编译
    if (language === 'typescript') {
      try {
        this.addOutput({
          type: 'info',
          message: '正在编译 TypeScript...',
          source: 'console'
        })

        // 开始编译性能监控
        const stopCompilationMonitoring = performanceMonitor.startCompilationMonitoring(code, 'typescript')
        
        // 重置编译状态
        useCodeRunnerStore.getState().setCompileState({
          isCompiling: true,
          compileTime: null // 重置当前编译时间
        })

        const compileResult = await typescriptCompiler.compile(code, {
          target: 'es2020',
          format: 'iife',
          minify: false
        })

        // 停止编译监控并记录时间
        const compileTime = stopCompilationMonitoring()
        
        // 更新编译状态
        const store = useCodeRunnerStore.getState()
        store.setCompileState({
          isCompiling: false,
          compileTime: compileTime,
          firstCompileTime: store.compileState.firstCompileTime || compileTime
        })

        if (!compileResult.success) {
          this.addOutput({
            type: 'error',
            message: `编译错误: ${compileResult.errors?.join('\n') || '未知错误'}`,
            source: 'error'
          })
          this.stopExecution()
          return
        }

        if (compileResult.warnings && compileResult.warnings.length > 0) {
          this.addOutput({
            type: 'warn',
            message: `编译警告: ${compileResult.warnings.join('\n')}`,
            source: 'console'
          })
        }

        codeToExecute = compileResult.code || ''
        
        this.addOutput({
          type: 'info',
          message: 'TypeScript 编译完成',
          source: 'console'
        })
      } catch (error) {
        this.addOutput({
          type: 'error',
          message: `编译失败: ${error instanceof Error ? error.message : '未知错误'}`,
          source: 'error'
        })
        this.stopExecution()
        return
      }
    }

    // 创建安全的全局对象
    const safeGlobal = {
      console: {
        log: (...args: unknown[]) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ')
          this.addOutput({
            type: 'log',
            message,
            source: 'console'
          })
        },
        error: (...args: unknown[]) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ')
          this.addOutput({
            type: 'error',
            message,
            source: 'console'
          })
        },
        warn: (...args: unknown[]) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ')
          this.addOutput({
            type: 'warn',
            message,
            source: 'console'
          })
        },
        info: (...args: unknown[]) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ')
          this.addOutput({
            type: 'info',
            message,
            source: 'console'
          })
        }
      },
      setTimeout: (fn: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => {
        if (typeof fn !== 'function') {
          throw new Error('setTimeout first argument must be a function')
        }
        return setTimeout(fn, Math.min(delay || 0, 5000), ...args)
      },
      setInterval: (fn: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => {
        if (typeof fn !== 'function') {
          throw new Error('setInterval first argument must be a function')
        }
        return setInterval(fn, Math.min(delay || 0, 1000), ...args)
      },
      clearTimeout,
      clearInterval,
      Promise,
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      parseInt,
      parseFloat,
      isNaN,
      isFinite
    }

    // 设置执行超时
    this.timeoutId = setTimeout(() => {
      this.addOutput({
        type: 'error',
        message: '代码执行超时',
        source: 'timeout'
      })
      this.stopExecution()
    }, config.timeout || 10000)

    try {
      // 使用安全管理器进行代码分析
      const securityCheck = securityManager.createSecureExecutionEnvironment(code)
      
      if (!securityCheck.isSafe) {
        // 显示安全警告和错误
        for (const warning of securityCheck.warnings) {
          this.addOutput({
            type: 'warn',
            message: `安全警告: ${warning}`,
            source: 'security'
          })
        }
        
        for (const error of securityCheck.errors) {
          this.addOutput({
            type: 'error',
            message: `安全错误: ${error}`,
            source: 'security'
          })
        }
        
        throw new Error('代码包含不安全操作，执行被阻止')
      }

      // 显示安全警告（如果有）
      for (const warning of securityCheck.warnings) {
        this.addOutput({
          type: 'warn',
          message: `安全警告: ${warning}`,
          source: 'security'
        })
      }

      // 开始运行时安全监控
      securityManager.startRuntimeMonitoring()

      // 创建安全的全局对象（集成安全检查）
      const secureGlobal = this.createSecureGlobal(safeGlobal)

      // 创建函数并执行
      const func = new Function('global', 
        'with (global) {' +
        codeToExecute +
        '}'
      )
      
      // 同步执行代码
      func(secureGlobal)
      
      // 执行完成
      const executionTime = stopExecutionMonitoring() // 停止性能监控
      
      // 更新执行状态
      const store = useCodeRunnerStore.getState()
      store.setExecutionState({
        isRunning: false,
        executionTime: executionTime,
        firstExecutionTime: store.executionState.firstExecutionTime || executionTime
      })
      
      this.stopExecution()
      
    } catch (error) {
      stopExecutionMonitoring() // 停止性能监控
      securityManager.stopRuntimeMonitoring() // 停止安全监控
      
      this.addOutput({
        type: 'error',
        message: error instanceof Error ? error.message : '未知错误',
        source: 'error'
      })
      this.stopExecution()
    }
  }

  private createSecureGlobal(baseGlobal: Record<string, unknown>): Record<string, unknown> {
    const secureGlobal = { ...baseGlobal }

    // 包装所有可能不安全的API
    const originalConsole = secureGlobal.console as Console
    secureGlobal.console = {
      ...originalConsole,
      // 保持原有的console方法
    }

    // 包装setTimeout和setInterval以进行安全检查
    const originalSetTimeout = secureGlobal.setTimeout as typeof setTimeout
    secureGlobal.setTimeout = (fn: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => {
      // 检查函数是否为字符串（不安全）
      if (typeof fn === 'string') {
        throw new Error('setTimeout不支持字符串形式的函数调用')
      }
      
      if (typeof fn !== 'function') {
        throw new Error('setTimeout第一个参数必须是函数')
      }

      // 检查资源限制
      if (!securityManager.checkResourceLimits()) {
        throw new Error('资源使用超出限制')
      }

      return originalSetTimeout(fn, Math.min(delay || 0, 5000), ...args)
    }

    const originalSetInterval = secureGlobal.setInterval as typeof setInterval
    secureGlobal.setInterval = (fn: (...args: unknown[]) => void, delay: number, ...args: unknown[]) => {
      // 检查函数是否为字符串（不安全）
      if (typeof fn === 'string') {
        throw new Error('setInterval不支持字符串形式的函数调用')
      }
      
      if (typeof fn !== 'function') {
        throw new Error('setInterval第一个参数必须是函数')
      }

      // 检查资源限制
      if (!securityManager.checkResourceLimits()) {
        throw new Error('资源使用超出限制')
      }

      return originalSetInterval(fn, Math.min(delay || 0, 1000), ...args)
    }

    // 添加安全检查到其他可能的API
    const protectedAPIs = ['Promise', 'Array', 'Object', 'String', 'Number', 'Boolean']
    for (const apiName of protectedAPIs) {
      if (secureGlobal[apiName]) {
        const originalAPI = secureGlobal[apiName]
        secureGlobal[apiName] = new Proxy(originalAPI as Record<string, unknown>, {
          get(target, prop) {
            // 检查API访问权限
            if (!securityManager.checkAPIAccess(apiName, prop)) {
              throw new Error(`访问被禁止的API: ${apiName}.${String(prop)}`)
            }
            return target[prop as string]
          }
        })
      }
    }

    return secureGlobal
  }


  private addOutput(output: Omit<CodeOutput, 'id' | 'timestamp'>) {
    const store = useCodeRunnerStore.getState()
    store.addOutput(output)
  }

  public stopExecution(): void {
    if (this.executionId) {
      // 停止安全监控
      securityManager.stopRuntimeMonitoring()
      
      // 清除超时
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }

      // 更新执行状态
      const store = useCodeRunnerStore.getState()
      store.setExecutionState({
        isRunning: false,
        isPaused: false,
        executionId: null,
        startTime: null,
        timeoutId: null
      })

      this.executionId = null
      this.startTime = 0
    }
  }

  public destroy(): void {
    this.stopExecution()
    phpSandboxManager.destroy()
  }

  public getStatus() {
    return {
      isRunning: this.executionId !== null,
      isReady: true,
      executionId: this.executionId,
      startTime: this.startTime
    }
  }
}

// 单例实例
export const simpleSandboxManager = new SimpleSandboxManager()
