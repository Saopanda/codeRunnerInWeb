import type { RuntimeSecurityConfig, RuntimeViolation, SecurityEvent, SecurityMetrics } from './types'

/**
 * 运行时安全监控
 * 监控代码执行过程中的安全违规行为
 */
export class RuntimeMonitoringLayer {
  private config: RuntimeSecurityConfig
  private violations: RuntimeViolation[] = []
  private events: SecurityEvent[] = []
  private metrics: SecurityMetrics
  private executionStartTime: number = 0
  private memoryBaseline: number = 0
  private isMonitoring: boolean = false

  constructor(config: Partial<RuntimeSecurityConfig> = {}) {
    this.config = {
      maxExecutionTime: 5000, // 5秒
      maxMemoryUsage: 50, // 50MB
      maxStackDepth: 100,
      allowedAPIs: [
        'console', 'Date', 'Math', 'JSON', 'Array', 'Object', 
        'String', 'Number', 'Boolean', 'RegExp', 'Promise',
        'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'
      ],
      blockedAPIs: [
        'eval', 'Function', 'document', 'window', 'localStorage', 
        'sessionStorage', 'XMLHttpRequest', 'fetch', 'require',
        'process', 'global', 'Buffer', 'fs', 'path'
      ],
      enableResourceMonitoring: true,
      enableCodeAnalysis: true,
      ...config
    }

    this.metrics = {
      totalAnalyses: 0,
      totalViolations: 0,
      blockedExecutions: 0,
      averageAnalysisTime: 0,
      riskLevelDistribution: {},
      violationTypes: {},
      lastUpdated: Date.now()
    }
  }

  /**
   * 开始监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.executionStartTime = Date.now()
    this.memoryBaseline = this.getCurrentMemoryUsage()

    // 设置执行超时
    if (this.config.maxExecutionTime > 0) {
      setTimeout(() => {
        this.checkExecutionTimeout()
      }, this.config.maxExecutionTime)
    }

    // 开始内存监控
    if (this.config.enableResourceMonitoring) {
      this.startMemoryMonitoring()
    }

    // 开始调用栈监控
    this.startStackMonitoring()

    this.recordEvent({
      type: 'allow'
    })
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    this.recordEvent({
      type: 'allow'
    })

    this.updateMetrics()
  }

  /**
   * 检查API调用是否被允许
   */
  checkAPIAccess(apiName: string, context?: unknown): boolean {
    if (!this.config.blockedAPIs.includes(apiName)) {
      return true
    }

    this.recordViolation({
      type: 'blocked_api',
      message: `尝试访问被禁止的API: ${apiName}`,
      severity: 'high',
      metadata: { apiName, context }
    })

    return false
  }

  /**
   * 检查资源使用限制
   */
  checkResourceLimits(): boolean {
    if (!this.config.enableResourceMonitoring) return true

    const currentMemory = this.getCurrentMemoryUsage()
    const memoryIncrease = currentMemory - this.memoryBaseline

    // 检查内存使用
    if (memoryIncrease > this.config.maxMemoryUsage * 1024 * 1024) {
      this.recordViolation({
        type: 'memory_limit',
        message: `内存使用超出限制: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        severity: 'high',
        metadata: { memoryUsage: memoryIncrease, limit: this.config.maxMemoryUsage }
      })
      return false
    }

    // 检查调用栈深度
    const stackDepth = this.getCurrentStackDepth()
    if (stackDepth > this.config.maxStackDepth) {
      this.recordViolation({
        type: 'stack_overflow',
        message: `调用栈深度超出限制: ${stackDepth}`,
        severity: 'critical',
        metadata: { stackDepth, limit: this.config.maxStackDepth }
      })
      return false
    }

    return true
  }

  /**
   * 记录违规行为
   */
  recordViolation(violation: Omit<RuntimeViolation, 'timestamp'>): void {
    const fullViolation: RuntimeViolation = {
      ...violation,
      timestamp: Date.now()
    }

    this.violations.push(fullViolation)

    // 保持最近100条违规记录
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-100)
    }

    this.recordEvent({
      type: 'violation',
      violation: fullViolation
    })

    // 如果是严重违规，立即停止执行
    if (violation.severity === 'critical') {
      this.stopExecution()
    }
  }

  /**
   * 记录安全事件
   */
  recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    this.events.push(fullEvent)

    // 保持最近500条事件记录
    if (this.events.length > 500) {
      this.events = this.events.slice(-500)
    }
  }

  /**
   * 获取当前内存使用情况
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number } }).memory
      return memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * 获取当前调用栈深度
   */
  private getCurrentStackDepth(): number {
    try {
      throw new Error()
    } catch (e: unknown) {
      const stack = (e as Error).stack || ''
      return (stack.match(/\n/g) || []).length
    }
  }

  /**
   * 检查执行超时
   */
  private checkExecutionTimeout(): void {
    if (!this.isMonitoring) return

    const executionTime = Date.now() - this.executionStartTime
    if (executionTime > this.config.maxExecutionTime) {
      this.recordViolation({
        type: 'timeout',
        message: `执行超时: ${executionTime}ms`,
        severity: 'high',
        metadata: { executionTime, limit: this.config.maxExecutionTime }
      })
      this.stopExecution()
    }
  }

  /**
   * 开始内存监控
   */
  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      if (!this.isMonitoring) return

      if (!this.checkResourceLimits()) {
        this.stopExecution()
        return
      }

      // 每100ms检查一次内存使用
      setTimeout(checkMemory, 100)
    }

    checkMemory()
  }

  /**
   * 开始调用栈监控
   */
  private startStackMonitoring(): void {
    // 定期检查调用栈深度
    const checkStack = (): void => {
      if (!this.isMonitoring) return

      const currentDepth = this.getCurrentStackDepth()
      if (currentDepth > this.config.maxStackDepth) {
        this.recordViolation({
          type: 'stack_overflow',
          message: `调用栈深度超出限制: ${currentDepth}`,
          severity: 'critical',
          metadata: { stackDepth: currentDepth, limit: this.config.maxStackDepth }
        })
        this.stopExecution()
        return
      }

      setTimeout(checkStack, 50)
    }

    checkStack()
  }

  /**
   * 停止执行
   */
  private stopExecution(): void {
    this.isMonitoring = false
    this.metrics.blockedExecutions++

    this.recordEvent({
      type: 'block'
    })

    // 抛出安全异常
    throw new Error('代码执行被安全监控阻止')
  }

  /**
   * 更新指标
   */
  private updateMetrics(): void {
    this.metrics.totalViolations = this.violations.length
    this.metrics.lastUpdated = Date.now()

    // 计算违规类型分布
    this.metrics.violationTypes = this.violations.reduce((acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 计算严重程度分布
    this.metrics.riskLevelDistribution = this.violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * 获取安全指标
   */
  getMetrics(): SecurityMetrics {
    this.updateMetrics()
    return { ...this.metrics }
  }

  /**
   * 获取违规记录
   */
  getViolations(): RuntimeViolation[] {
    return [...this.violations]
  }

  /**
   * 获取安全事件
   */
  getEvents(): SecurityEvent[] {
    return [...this.events]
  }

  /**
   * 清空记录
   */
  clear(): void {
    this.violations = []
    this.events = []
    this.metrics = {
      totalAnalyses: 0,
      totalViolations: 0,
      blockedExecutions: 0,
      averageAnalysisTime: 0,
      riskLevelDistribution: {},
      violationTypes: {},
      lastUpdated: Date.now()
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<RuntimeSecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}
