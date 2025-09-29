import { CodeAnalysisLayer } from './code-analysis'
import { RuntimeMonitoringLayer } from './runtime-monitoring'
import type {
  SecurityAnalysisResult,
  RuntimeSecurityConfig,
  SecurityEvent,
  SecurityMetrics,
  RuntimeViolation,
} from './types'

/**
 * 安全管理器
 * 统一管理代码分析和运行时监控
 */
export class SecurityManager {
  private codeAnalyzer: CodeAnalysisLayer
  private runtimeMonitor: RuntimeMonitoringLayer
  private isEnabled: boolean = true

  constructor(config: Partial<RuntimeSecurityConfig> = {}) {
    this.codeAnalyzer = new CodeAnalysisLayer()
    this.runtimeMonitor = new RuntimeMonitoringLayer(config)
  }

  /**
   * 启用安全防护
   */
  enable(): void {
    this.isEnabled = true
  }

  /**
   * 禁用安全防护
   */
  disable(): void {
    this.isEnabled = false
    this.runtimeMonitor.stopMonitoring()
  }

  /**
   * 分析代码安全性
   */
  analyzeCode(code: string): SecurityAnalysisResult {
    if (!this.isEnabled) {
      return {
        safe: true,
        issues: [],
        riskLevel: 'low',
        confidence: 1.0,
        analysisTime: 0,
      }
    }

    return this.codeAnalyzer.analyze(code)
  }

  /**
   * 开始运行时监控
   */
  startRuntimeMonitoring(): void {
    if (!this.isEnabled) return
    this.runtimeMonitor.startMonitoring()
  }

  /**
   * 停止运行时监控
   */
  stopRuntimeMonitoring(): void {
    this.runtimeMonitor.stopMonitoring()
  }

  /**
   * 检查API访问权限
   */
  checkAPIAccess(apiName: string, context?: unknown): boolean {
    if (!this.isEnabled) return true
    return this.runtimeMonitor.checkAPIAccess(apiName, context)
  }

  /**
   * 检查资源限制
   */
  checkResourceLimits(): boolean {
    if (!this.isEnabled) return true
    return this.runtimeMonitor.checkResourceLimits()
  }

  /**
   * 获取安全指标
   */
  getSecurityMetrics(): SecurityMetrics {
    return this.runtimeMonitor.getMetrics()
  }

  /**
   * 获取违规记录
   */
  getViolations(): RuntimeViolation[] {
    return this.runtimeMonitor.getViolations()
  }

  /**
   * 获取安全事件
   */
  getSecurityEvents(): SecurityEvent[] {
    return this.runtimeMonitor.getEvents()
  }

  /**
   * 更新安全配置
   */
  updateSecurityConfig(config: Partial<RuntimeSecurityConfig>): void {
    this.runtimeMonitor.updateConfig(config)
  }

  /**
   * 清空所有记录
   */
  clearAll(): void {
    this.runtimeMonitor.clear()
  }

  /**
   * 获取安全状态摘要
   */
  getSecuritySummary(): {
    isEnabled: boolean
    totalViolations: number
    blockedExecutions: number
    lastViolation?: RuntimeViolation
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  } {
    const metrics = this.getSecurityMetrics()
    const violations = this.getViolations()

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (violations.length > 0) {
      const criticalCount = violations.filter(
        (v) => v.severity === 'critical'
      ).length
      const highCount = violations.filter((v) => v.severity === 'high').length
      const mediumCount = violations.filter(
        (v) => v.severity === 'medium'
      ).length

      if (criticalCount > 0) riskLevel = 'critical'
      else if (highCount > 2) riskLevel = 'high'
      else if (highCount > 0 || mediumCount > 3) riskLevel = 'medium'
    }

    return {
      isEnabled: this.isEnabled,
      totalViolations: metrics.totalViolations,
      blockedExecutions: metrics.blockedExecutions,
      lastViolation: violations[violations.length - 1],
      riskLevel,
    }
  }

  /**
   * 创建安全的执行环境
   */
  createSecureExecutionEnvironment(code: string): {
    isSafe: boolean
    analysis: SecurityAnalysisResult
    warnings: string[]
    errors: string[]
  } {
    const analysis = this.analyzeCode(code)
    const warnings: string[] = []
    const errors: string[] = []

    // 根据分析结果分类问题
    for (const issue of analysis.issues) {
      const message = `第${issue.line}行: ${issue.message}`

      if (issue.severity === 'critical' || issue.severity === 'high') {
        errors.push(message)
      } else {
        warnings.push(message)
      }
    }

    // 根据风险等级决定是否允许执行
    let isSafe = true
    if (
      analysis.riskLevel === 'critical' ||
      (analysis.riskLevel === 'high' && errors.length > 2)
    ) {
      isSafe = false
    }

    return {
      isSafe,
      analysis,
      warnings,
      errors,
    }
  }

  /**
   * 导出安全报告
   */
  exportSecurityReport(): {
    timestamp: string
    summary: ReturnType<SecurityManager['getSecuritySummary']>
    metrics: SecurityMetrics
    violations: RuntimeViolation[]
    events: SecurityEvent[]
  } {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getSecuritySummary(),
      metrics: this.getSecurityMetrics(),
      violations: this.getViolations(),
      events: this.getSecurityEvents(),
    }
  }
}

// 导出单例实例
export const securityManager = new SecurityManager()
