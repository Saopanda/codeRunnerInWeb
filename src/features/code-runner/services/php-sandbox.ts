import { useCodeRunnerStore, type CodeOutput, type SandboxConfig } from '../stores/code-runner-store'

export class PHPSandboxManager {
  private executionId: string | null = null
  private timeoutId: number | null = null
  private startTime: number = 0
  private PhpWebClass: any = null // eslint-disable-line @typescript-eslint/no-explicit-any
  private isExecuting: boolean = false
  private currentPhpInstance: any = null // eslint-disable-line @typescript-eslint/no-explicit-any

  public async initialize(): Promise<void> {
    // 如果还没有加载 PhpWeb 类，先加载它
    if (!this.PhpWebClass) {
      try {
        // 动态导入 PHP-WASM
        const phpModule = await import('php-wasm/PhpWeb.mjs')
        this.PhpWebClass = phpModule.PhpWeb
      } catch (error) {
        this.addOutput({
          type: 'error',
          message: `PHP-WASM 加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
          source: 'error'
        })
        throw error
      }
    }
  }

  public async executeCode(code: string, config: SandboxConfig): Promise<void> {
    // 防止并发执行
    if (this.isExecuting) {
      this.addOutput({
        type: 'warn',
        message: 'PHP 代码正在执行中，请等待完成后再试',
        source: 'system'
      })
      return
    }

    this.isExecuting = true

    try {
      // 停止当前执行（如果有）
      this.stopExecution()

      // 等待一小段时间确保清理完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 确保 PhpWeb 类已加载
      await this.initialize()

      this.executionId = `php-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.startTime = Date.now()

      // 更新执行状态
      const store = useCodeRunnerStore.getState()
      store.setExecutionState({
        isRunning: true,
        executionId: this.executionId,
        startTime: this.startTime,
        executionTime: null
      })

      // 清空之前的输出
      store.clearOutputs()

      // 设置执行超时
      this.timeoutId = window.setTimeout(() => {
        this.addOutput({
          type: 'error',
          message: 'PHP 代码执行超时',
          source: 'timeout'
        })
        this.stopExecution()
      }, config.timeout || 10000)

      // 清理用户代码，但保留完整的PHP标签
      let cleanCode = code.trim()

      // 如果没有PHP开始标签，添加一个
      if (!cleanCode.startsWith('<?php') && !cleanCode.startsWith('<?')) {
        cleanCode = '<?php\n' + cleanCode
      }

      // 复用或创建 PHP 实例
      if (!this.currentPhpInstance) {
        this.addOutput({
          type: 'info',
          message: '正在初始化 PHP 环境...',
          source: 'system'
        })

        this.currentPhpInstance = new this.PhpWebClass()

        // 等待实例准备就绪
        await new Promise<void>((resolve, reject) => {
          const readyTimeout = window.setTimeout(() => {
            reject(new Error('PHP 实例初始化超时'))
          }, 15000) // 增加超时时间

          const readyHandler = () => {
            window.clearTimeout(readyTimeout)
            this.addOutput({
              type: 'info',
              message: 'PHP 环境初始化完成',
              source: 'system'
            })
            resolve()
          }

          const errorHandler = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            window.clearTimeout(readyTimeout)
            reject(new Error(event.detail || 'PHP 初始化失败'))
          }

          this.currentPhpInstance.addEventListener('ready', readyHandler, { once: true })
          this.currentPhpInstance.addEventListener('error', errorHandler, { once: true })
        })
      }

      // 捕获PHP输出
      let phpOutput = ''
      let phpErrors = ''

      const outputHandler = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event.detail) {
          phpOutput += event.detail
          this.addOutput({
            type: 'log',
            message: event.detail,
            source: 'console'
          })
        }
      }

      const errorHandler = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event.detail) {
          phpErrors += event.detail
          this.addOutput({
            type: 'error',
            message: event.detail,
            source: 'error'
          })
        }
      }

      // 添加事件监听器
      this.currentPhpInstance.addEventListener('output', outputHandler)
      this.currentPhpInstance.addEventListener('error', errorHandler)

      try {
        this.addOutput({
          type: 'info',
          message: '正在执行 PHP 代码...',
          source: 'system'
        })

        // 执行PHP代码
        const returnCode = await this.currentPhpInstance.run(cleanCode)

        // 如果没有输出但执行成功，显示成功信息
        if (phpOutput.trim() === '' && phpErrors.trim() === '' && returnCode === 0) {
          this.addOutput({
            type: 'info',
            message: 'PHP 代码执行完成（无输出）',
            source: 'system'
          })
        } else if (returnCode === 0) {
          this.addOutput({
            type: 'info',
            message: 'PHP 代码执行完成',
            source: 'system'
          })
        } else {
          this.addOutput({
            type: 'error',
            message: `PHP 执行失败，返回码: ${returnCode}`,
            source: 'error'
          })
        }

      } catch (error) {
        this.addOutput({
          type: 'error',
          message: `PHP 执行错误: ${error instanceof Error ? error.message : '未知错误'}`,
          source: 'error'
        })
      } finally {
        // 清理事件监听器
        this.currentPhpInstance.removeEventListener('output', outputHandler)
        this.currentPhpInstance.removeEventListener('error', errorHandler)
      }

      // 等待输出处理完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 只清理执行状态，不更新 store
      this.cleanupExecution()

    } catch (error) {
      this.addOutput({
        type: 'error',
        message: error instanceof Error ? error.message : 'PHP 执行错误',
        source: 'error'
      })
      this.cleanupExecution()
      throw error // 重新抛出错误让上层处理
    } finally {
      this.isExecuting = false
    }
  }

  private cleanupExecution(): void {
    // 清除超时
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // 清除执行ID
    this.executionId = null
    this.startTime = 0
  }


  private addOutput(output: Omit<CodeOutput, 'id' | 'timestamp'>) {
    const store = useCodeRunnerStore.getState()
    store.addOutput(output)
  }

  public stopExecution(): void {
    if (this.executionId) {
      // 清除超时
      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId)
        this.timeoutId = null
      }

      // 立即清除执行ID，防止回调函数在运行时退出后执行
      const currentExecutionId = this.executionId
      this.executionId = null
      this.startTime = 0

      // 更新执行状态
      const store = useCodeRunnerStore.getState()
      store.setExecutionState({
        isRunning: false,
        isPaused: false,
        executionId: null,
        startTime: null,
        timeoutId: null
      })

      // 添加执行完成信息
      this.addOutput({
        type: 'info',
        message: `执行完成 (ID: ${currentExecutionId})`,
        source: 'system'
      })
    }
  }

  public destroy(): void {
    this.stopExecution()

    // 销毁 PHP 实例
    if (this.currentPhpInstance) {
      try {
        if (typeof this.currentPhpInstance.destroy === 'function') {
          this.currentPhpInstance.destroy()
        }
      } catch (error) {
        // 忽略销毁错误
        // eslint-disable-next-line no-console
        console.warn('PHP 实例销毁时出现错误:', error)
      }
      this.currentPhpInstance = null
    }
  }

  public getStatus() {
    return {
      isRunning: this.executionId !== null,
      isReady: this.PhpWebClass !== null,
      executionId: this.executionId,
      startTime: this.startTime,
      hasInstance: this.currentPhpInstance !== null
    }
  }

  /**
   * 强制重置PHP实例
   * 用于解决实例状态异常的问题
   */
  public async forceReset(): Promise<void> {
    this.addOutput({
      type: 'info',
      message: '正在强制重置 PHP 环境...',
      source: 'system'
    })

    // 销毁当前实例
    if (this.currentPhpInstance) {
      try {
        if (typeof this.currentPhpInstance.destroy === 'function') {
          this.currentPhpInstance.destroy()
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('销毁 PHP 实例时出现错误:', error)
      }
      this.currentPhpInstance = null
    }

    // 重置状态
    this.isExecuting = false
    this.executionId = null
    this.startTime = 0

    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    this.addOutput({
      type: 'info',
      message: 'PHP 环境重置完成',
      source: 'system'
    })
  }
}

// 单例实例
export const phpSandboxManager = new PHPSandboxManager()
