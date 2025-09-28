/**
 * 安全层类型定义
 */

export interface SecurityIssue {
  type: 'dangerous_api' | 'suspicious_pattern' | 'resource_abuse' | 'injection_risk'
  message: string
  line?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestion?: string
}

export interface SecurityAnalysisResult {
  safe: boolean
  issues: SecurityIssue[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  confidence: number // 0-1
  analysisTime: number
}

export interface RuntimeSecurityConfig {
  maxExecutionTime: number // 最大执行时间（毫秒）
  maxMemoryUsage: number // 最大内存使用（MB）
  maxStackDepth: number // 最大调用栈深度
  allowedAPIs: string[] // 允许的API列表
  blockedAPIs: string[] // 禁止的API列表
  enableResourceMonitoring: boolean // 是否启用资源监控
  enableCodeAnalysis: boolean // 是否启用代码分析
}

export interface RuntimeViolation {
  type: 'timeout' | 'memory_limit' | 'stack_overflow' | 'blocked_api' | 'resource_abuse'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface SecurityEvent {
  id: string
  type: 'analysis' | 'violation' | 'block' | 'allow'
  timestamp: number
  code?: string
  result?: SecurityAnalysisResult
  violation?: RuntimeViolation
  metadata?: Record<string, unknown>
}

export interface SecurityMetrics {
  totalAnalyses: number
  totalViolations: number
  blockedExecutions: number
  averageAnalysisTime: number
  riskLevelDistribution: Record<string, number>
  violationTypes: Record<string, number>
  lastUpdated: number
}
