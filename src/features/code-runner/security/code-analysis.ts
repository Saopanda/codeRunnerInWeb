import type { SecurityIssue, SecurityAnalysisResult } from './types'

/**
 * 代码安全分析层
 * 分析代码中的潜在安全风险
 */
export class CodeAnalysisLayer {
  private dangerousPatterns = [
    // 代码执行相关
    {
      pattern: /eval\s*\(/,
      type: 'dangerous_api' as const,
      severity: 'critical' as const,
      message: '检测到 eval() 使用',
      suggestion: 'eval() 可能导致代码注入攻击，请避免使用',
    },
    {
      pattern: /Function\s*\(/,
      type: 'dangerous_api' as const,
      severity: 'critical' as const,
      message: '检测到 Function 构造函数使用',
      suggestion: 'Function 构造函数可能导致代码注入攻击',
    },
    {
      pattern: /setTimeout\s*\(\s*['"`]/,
      type: 'dangerous_api' as const,
      severity: 'high' as const,
      message: '检测到字符串形式的 setTimeout 调用',
      suggestion: '请使用函数而不是字符串作为 setTimeout 的第一个参数',
    },
    {
      pattern: /setInterval\s*\(\s*['"`]/,
      type: 'dangerous_api' as const,
      severity: 'high' as const,
      message: '检测到字符串形式的 setInterval 调用',
      suggestion: '请使用函数而不是字符串作为 setInterval 的第一个参数',
    },

    // DOM 操作相关
    {
      pattern: /document\./,
      type: 'dangerous_api' as const,
      severity: 'high' as const,
      message: '检测到 DOM 操作',
      suggestion: 'DOM 操作在沙箱环境中可能不安全',
    },
    {
      pattern: /window\./,
      type: 'dangerous_api' as const,
      severity: 'high' as const,
      message: '检测到 window 对象访问',
      suggestion: 'window 对象访问可能破坏沙箱隔离',
    },

    // 存储相关
    {
      pattern: /localStorage/,
      type: 'dangerous_api' as const,
      severity: 'medium' as const,
      message: '检测到 localStorage 使用',
      suggestion: 'localStorage 在沙箱环境中被禁用',
    },
    {
      pattern: /sessionStorage/,
      type: 'dangerous_api' as const,
      severity: 'medium' as const,
      message: '检测到 sessionStorage 使用',
      suggestion: 'sessionStorage 在沙箱环境中被禁用',
    },

    // 网络相关
    {
      pattern: /XMLHttpRequest/,
      type: 'dangerous_api' as const,
      severity: 'high' as const,
      message: '检测到 XMLHttpRequest 使用',
      suggestion: '网络请求在沙箱环境中被禁用',
    },
    {
      pattern: /fetch\s*\(/,
      type: 'dangerous_api' as const,
      severity: 'high' as const,
      message: '检测到 fetch API 使用',
      suggestion: '网络请求在沙箱环境中被禁用',
    },

    // 文件系统相关
    {
      pattern: /require\s*\(/,
      type: 'dangerous_api' as const,
      severity: 'high' as const,
      message: '检测到 require() 使用',
      suggestion: 'require() 在浏览器环境中不可用',
    },
    {
      pattern: /import\s+.*\s+from\s+['"`]/,
      type: 'dangerous_api' as const,
      severity: 'medium' as const,
      message: '检测到 ES6 模块导入',
      suggestion: '模块导入在沙箱环境中可能不可用',
    },

    // 可疑模式
    {
      pattern: /while\s*\(\s*true\s*\)/,
      type: 'suspicious_pattern' as const,
      severity: 'high' as const,
      message: '检测到无限循环模式',
      suggestion: '无限循环可能导致页面冻结，请添加退出条件',
    },
    {
      pattern: /for\s*\(\s*;\s*;\s*\)/,
      type: 'suspicious_pattern' as const,
      severity: 'high' as const,
      message: '检测到无限循环模式',
      suggestion: '无限循环可能导致页面冻结，请添加退出条件',
    },

    // 递归风险（简化模式以避免性能问题）
    {
      pattern: /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\w+\s*\(/,
      type: 'suspicious_pattern' as const,
      severity: 'medium' as const,
      message: '检测到可能的递归调用',
      suggestion: '请确保递归有适当的退出条件，避免栈溢出',
    },
  ]

  /**
   * 分析代码安全性
   */
  analyze(code: string): SecurityAnalysisResult {
    const startTime = performance.now()
    const issues: SecurityIssue[] = []

    // 分析危险模式
    for (const { pattern, type, severity, message, suggestion } of this
      .dangerousPatterns) {
      const matches = this.findAllMatches(code, pattern)

      // 只添加第一个匹配项以避免重复
      if (matches.length > 0) {
        issues.push({
          type,
          message,
          line: this.findLineNumber(code, matches[0].index),
          severity,
          suggestion,
        })
      }
    }

    // 分析代码复杂度
    const complexityIssues = this.analyzeComplexity(code)
    issues.push(...complexityIssues)

    // 分析资源使用模式
    const resourceIssues = this.analyzeResourceUsage(code)
    issues.push(...resourceIssues)

    const endTime = performance.now()
    const analysisTime = endTime - startTime

    return {
      safe: issues.length === 0,
      issues,
      riskLevel: this.calculateRiskLevel(issues),
      confidence: this.calculateConfidence(issues, code),
      analysisTime,
    }
  }

  /**
   * 查找所有匹配项（简化版本以避免内存问题）
   */
  private findAllMatches(code: string, pattern: RegExp): RegExpExecArray[] {
    const matches: RegExpExecArray[] = []
    let match: RegExpExecArray | null
    let searchCount = 0
    const maxSearches = 100 // 限制搜索次数

    // 重置正则表达式的 lastIndex
    pattern.lastIndex = 0

    while ((match = pattern.exec(code)) !== null && searchCount < maxSearches) {
      matches.push(match)
      searchCount++

      // 防止无限循环
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++
      }
    }

    return matches
  }

  /**
   * 计算行号
   */
  private findLineNumber(code: string, index: number): number {
    const beforeMatch = code.substring(0, index)
    return (beforeMatch.match(/\n/g) || []).length + 1
  }

  /**
   * 分析代码复杂度（简化版本）
   */
  private analyzeComplexity(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // 检查嵌套深度（简化版本）
    const maxNesting = this.calculateMaxNesting(code)
    if (maxNesting > 15) {
      issues.push({
        type: 'suspicious_pattern',
        message: `代码嵌套深度过深 (${maxNesting} 层)`,
        severity: 'medium',
        suggestion: '请考虑重构代码以降低复杂度',
      })
    }

    // 简化函数长度检查
    const functionMatches = code.match(/function\s+\w+/g) || []
    if (functionMatches.length > 20) {
      issues.push({
        type: 'suspicious_pattern',
        message: `函数数量过多 (${functionMatches.length} 个)`,
        severity: 'low',
        suggestion: '请考虑将代码拆分为更小的模块',
      })
    }

    return issues
  }

  /**
   * 分析资源使用模式
   */
  private analyzeResourceUsage(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // 检查循环数量
    const loopCount = (code.match(/for\s*\(|while\s*\(|do\s*\{/g) || []).length
    if (loopCount > 5) {
      issues.push({
        type: 'resource_abuse',
        message: `检测到大量循环 (${loopCount} 个)`,
        severity: 'medium',
        suggestion: '请确保循环有适当的退出条件和时间限制',
      })
    }

    // 检查数组操作
    const arrayOps = (
      code.match(/\.push\(|\.pop\(|\.shift\(|\.unshift\(/g) || []
    ).length
    if (arrayOps > 20) {
      issues.push({
        type: 'resource_abuse',
        message: `检测到大量数组操作 (${arrayOps} 次)`,
        severity: 'low',
        suggestion: '请考虑优化数组操作或添加大小限制',
      })
    }

    return issues
  }

  /**
   * 计算最大嵌套深度
   */
  private calculateMaxNesting(code: string): number {
    let maxDepth = 0
    let currentDepth = 0

    for (const char of code) {
      if (char === '{') {
        currentDepth++
        maxDepth = Math.max(maxDepth, currentDepth)
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1)
      }
    }

    return maxDepth
  }

  /**
   * 计算风险等级
   */
  private calculateRiskLevel(
    issues: SecurityIssue[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = issues.filter((i) => i.severity === 'critical').length
    const highCount = issues.filter((i) => i.severity === 'high').length
    const mediumCount = issues.filter((i) => i.severity === 'medium').length

    if (criticalCount > 0) return 'critical'
    if (highCount > 2) return 'high'
    if (highCount > 0 || mediumCount > 3) return 'medium'
    return 'low'
  }

  /**
   * 计算分析置信度
   */
  private calculateConfidence(issues: SecurityIssue[], code: string): number {
    if (issues.length === 0) return 1.0

    // 基于代码长度和问题数量的简单置信度计算
    const codeLength = code.length
    const issueDensity = issues.length / Math.max(codeLength / 100, 1)

    // 置信度随问题密度递减
    return Math.max(0.1, 1.0 - issueDensity * 0.1)
  }
}
