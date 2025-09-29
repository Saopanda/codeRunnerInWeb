import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityManager } from '../security-manager'

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 1024 * 1024, // 1MB
    totalJSHeapSize: 2048 * 1024, // 2MB
    jsHeapSizeLimit: 4096 * 1024, // 4MB
  },
  writable: true,
})

describe('SecurityManager', () => {
  let securityManager: SecurityManager

  beforeEach(() => {
    securityManager = new SecurityManager({
      maxExecutionTime: 1000,
      maxMemoryUsage: 1, // 1MB
      maxStackDepth: 10,
      allowedAPIs: ['console', 'Date', 'Math'],
      blockedAPIs: ['eval', 'document', 'window'],
      enableResourceMonitoring: true,
      enableCodeAnalysis: true,
    })
  })

  describe('enable and disable', () => {
    it('should enable and disable security', () => {
      expect(securityManager.getSecuritySummary().isEnabled).toBe(true)

      securityManager.disable()
      expect(securityManager.getSecuritySummary().isEnabled).toBe(false)

      securityManager.enable()
      expect(securityManager.getSecuritySummary().isEnabled).toBe(true)
    })

    it('should not analyze code when disabled', () => {
      securityManager.disable()

      const result = securityManager.analyzeCode(
        'eval("console.log(\'hello\')")'
      )

      expect(result.safe).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.riskLevel).toBe('low')
    })
  })

  describe('analyzeCode', () => {
    it('should analyze safe code correctly', () => {
      const code = 'console.log("Hello, World!")'
      const result = securityManager.analyzeCode(code)

      expect(result.safe).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.riskLevel).toBe('low')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should detect dangerous code', () => {
      const code = 'eval("console.log(\'hello\')")'
      const result = securityManager.analyzeCode(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('critical')
      expect(result.riskLevel).toBe('critical')
    })

    it('should detect multiple security issues', () => {
      const code = `
        eval("console.log('eval')");
        document.getElementById("test");
        localStorage.setItem("key", "value");
      `
      const result = securityManager.analyzeCode(code)

      expect(result.safe).toBe(false)
      expect(result.issues.length).toBeGreaterThan(2)
      expect(result.riskLevel).toBe('critical')
    })
  })

  describe('runtime monitoring', () => {
    it('should start and stop runtime monitoring', () => {
      securityManager.startRuntimeMonitoring()

      // Should not throw
      expect(() => securityManager.stopRuntimeMonitoring()).not.toThrow()
    })

    it('should check API access correctly', () => {
      securityManager.startRuntimeMonitoring()

      expect(securityManager.checkAPIAccess('console')).toBe(true)
      expect(securityManager.checkAPIAccess('eval')).toBe(false)

      securityManager.stopRuntimeMonitoring()
    })

    it('should check resource limits', () => {
      securityManager.startRuntimeMonitoring()

      // Mock normal memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 512 * 1024, // 0.5MB (under limit)
          totalJSHeapSize: 1024 * 1024,
          jsHeapSizeLimit: 4096 * 1024,
        },
        writable: true,
      })

      expect(securityManager.checkResourceLimits()).toBe(true)

      securityManager.stopRuntimeMonitoring()
    })
  })

  describe('createSecureExecutionEnvironment', () => {
    it('should allow safe code execution', () => {
      const code = 'console.log("Hello, World!")'
      const result = securityManager.createSecureExecutionEnvironment(code)

      expect(result.isSafe).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
      expect(result.analysis.safe).toBe(true)
    })

    it('should block dangerous code execution', () => {
      const code = 'eval("console.log(\'hello\')")'
      const result = securityManager.createSecureExecutionEnvironment(code)

      expect(result.isSafe).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('eval')
    })

    it('should categorize issues by severity', () => {
      const code = `
        eval("console.log('critical')");
        localStorage.setItem("key", "value");
        while(true) { console.log("loop"); }
      `
      const result = securityManager.createSecureExecutionEnvironment(code)

      expect(result.isSafe).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0) // Critical and high severity
      expect(result.warnings.length).toBeGreaterThan(0) // Medium and low severity
    })

    it('should allow execution for medium risk code with few errors', () => {
      const code = 'localStorage.setItem("key", "value")'
      const result = securityManager.createSecureExecutionEnvironment(code)

      // Medium risk with single error should be allowed
      expect(result.isSafe).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should block execution for high risk code with many errors', () => {
      const code = `
        eval("console.log('eval')");
        document.getElementById("test");
        window.location.href;
        localStorage.setItem("key", "value");
      `
      const result = securityManager.createSecureExecutionEnvironment(code)

      expect(result.isSafe).toBe(false)
      expect(result.errors.length).toBeGreaterThan(2)
    })
  })

  describe('getSecuritySummary', () => {
    it('should provide correct security summary', () => {
      const summary = securityManager.getSecuritySummary()

      expect(summary.isEnabled).toBe(true)
      expect(summary.totalViolations).toBe(0)
      expect(summary.blockedExecutions).toBe(0)
      expect(summary.riskLevel).toBe('low')
      expect(summary.lastViolation).toBeUndefined()
    })

    it('should update summary after violations', () => {
      securityManager.startRuntimeMonitoring()
      securityManager.checkAPIAccess('eval') // This should create a violation
      securityManager.stopRuntimeMonitoring()

      const summary = securityManager.getSecuritySummary()

      expect(summary.totalViolations).toBe(1)
      expect(summary.riskLevel).toBe('medium')
      expect(summary.lastViolation).toBeDefined()
      expect(summary.lastViolation?.type).toBe('blocked_api')
    })
  })

  describe('exportSecurityReport', () => {
    it('should export comprehensive security report', () => {
      // Generate some activity
      securityManager.analyzeCode('eval("test")')
      securityManager.startRuntimeMonitoring()
      securityManager.checkAPIAccess('eval')
      securityManager.stopRuntimeMonitoring()

      const report = securityManager.exportSecurityReport()

      expect(report.timestamp).toBeDefined()
      expect(report.summary).toBeDefined()
      expect(report.metrics).toBeDefined()
      expect(report.violations).toBeDefined()
      expect(report.events).toBeDefined()

      expect(report.summary.totalViolations).toBeGreaterThan(0)
      expect(report.metrics.totalViolations).toBeGreaterThan(0)
    })
  })

  describe('updateSecurityConfig', () => {
    it('should update security configuration', () => {
      const newConfig = {
        maxExecutionTime: 2000,
        blockedAPIs: ['eval', 'Function', 'document'],
      }

      securityManager.updateSecurityConfig(newConfig)

      securityManager.startRuntimeMonitoring()
      expect(securityManager.checkAPIAccess('eval')).toBe(false)
      expect(securityManager.checkAPIAccess('Function')).toBe(false)
      expect(securityManager.checkAPIAccess('document')).toBe(false)
      securityManager.stopRuntimeMonitoring()
    })
  })

  describe('clearAll', () => {
    it('should clear all security data', () => {
      // Generate some activity
      securityManager.analyzeCode('eval("test")')
      securityManager.startRuntimeMonitoring()
      securityManager.checkAPIAccess('eval')
      securityManager.stopRuntimeMonitoring()

      expect(securityManager.getViolations()).toHaveLength(1)
      expect(securityManager.getSecurityEvents()).toHaveLength(3)

      securityManager.clearAll()

      expect(securityManager.getViolations()).toHaveLength(0)
      expect(securityManager.getSecurityEvents()).toHaveLength(0)
      expect(securityManager.getSecurityMetrics().totalViolations).toBe(0)
    })
  })

  describe('getSecurityMetrics', () => {
    it('should provide security metrics', () => {
      const metrics = securityManager.getSecurityMetrics()

      expect(metrics.totalAnalyses).toBe(0)
      expect(metrics.totalViolations).toBe(0)
      expect(metrics.blockedExecutions).toBe(0)
      expect(metrics.averageAnalysisTime).toBe(0)
      expect(metrics.riskLevelDistribution).toBeDefined()
      expect(metrics.violationTypes).toBeDefined()
      expect(metrics.lastUpdated).toBeDefined()
    })
  })

  describe('getViolations', () => {
    it('should return violations list', () => {
      securityManager.startRuntimeMonitoring()
      securityManager.checkAPIAccess('eval')
      securityManager.stopRuntimeMonitoring()

      const violations = securityManager.getViolations()

      expect(violations).toHaveLength(1)
      expect(violations[0].type).toBe('blocked_api')
      expect(violations[0].message).toContain('eval')
    })
  })

  describe('getSecurityEvents', () => {
    it('should return security events list', () => {
      securityManager.startRuntimeMonitoring()
      securityManager.stopRuntimeMonitoring()

      const events = securityManager.getSecurityEvents()

      expect(events).toHaveLength(2) // start and stop events
      expect(events[0].type).toBe('allow')
      expect(events[1].type).toBe('allow')
    })
  })
})
