import { describe, it, expect, beforeEach } from 'vitest'
import { RuntimeMonitoringLayer } from '../runtime-monitoring'

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 1024 * 1024, // 1MB
    totalJSHeapSize: 2048 * 1024, // 2MB
    jsHeapSizeLimit: 4096 * 1024 // 4MB
  },
  writable: true
})

describe('RuntimeMonitoringLayer', () => {
  let monitor: RuntimeMonitoringLayer

  beforeEach(() => {
    monitor = new RuntimeMonitoringLayer({
      maxExecutionTime: 1000,
      maxMemoryUsage: 1, // 1MB
      maxStackDepth: 10,
      allowedAPIs: ['console', 'Date', 'Math'],
      blockedAPIs: ['eval', 'document', 'window'],
      enableResourceMonitoring: true,
      enableCodeAnalysis: true
    })
  })

  describe('startMonitoring and stopMonitoring', () => {
    it('should start and stop monitoring', () => {
      monitor.startMonitoring()
      expect(monitor.getMetrics().totalViolations).toBe(0)
      
      monitor.stopMonitoring()
      expect(monitor.getEvents()).toHaveLength(2) // start and stop events
    })

    it('should not start monitoring twice', () => {
      monitor.startMonitoring()
      const firstStart = monitor.getEvents().length
      
      monitor.startMonitoring()
      const secondStart = monitor.getEvents().length
      
      expect(secondStart).toBe(firstStart) // No additional start event
    })
  })

  describe('checkAPIAccess', () => {
    it('should allow access to allowed APIs', () => {
      monitor.startMonitoring()
      
      expect(monitor.checkAPIAccess('console')).toBe(true)
      expect(monitor.checkAPIAccess('Date')).toBe(true)
      expect(monitor.checkAPIAccess('Math')).toBe(true)
      
      monitor.stopMonitoring()
    })

    it('should block access to blocked APIs', () => {
      monitor.startMonitoring()
      
      expect(monitor.checkAPIAccess('eval')).toBe(false)
      expect(monitor.checkAPIAccess('document')).toBe(false)
      expect(monitor.checkAPIAccess('window')).toBe(false)
      
      const violations = monitor.getViolations()
      expect(violations.length).toBe(3)
      expect(violations.every(v => v.type === 'blocked_api')).toBe(true)
      
      monitor.stopMonitoring()
    })

    it('should record violations for blocked API access', () => {
      monitor.startMonitoring()
      
      monitor.checkAPIAccess('eval', { context: 'test' })
      
      const violations = monitor.getViolations()
      expect(violations).toHaveLength(1)
      expect(violations[0].type).toBe('blocked_api')
      expect(violations[0].message).toContain('eval')
      expect(violations[0].metadata?.apiName).toBe('eval')
      expect(violations[0].metadata?.context).toEqual({ context: 'test' })
      
      monitor.stopMonitoring()
    })
  })

  describe('checkResourceLimits', () => {
    it('should allow normal resource usage', () => {
      monitor.startMonitoring()
      
      // Mock normal memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 512 * 1024, // 0.5MB (under limit)
          totalJSHeapSize: 1024 * 1024,
          jsHeapSizeLimit: 4096 * 1024
        },
        writable: true
      })
      
      expect(monitor.checkResourceLimits()).toBe(true)
      
      monitor.stopMonitoring()
    })

    it('should detect memory limit violations', () => {
      monitor.startMonitoring()
      
      // Mock excessive memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 2048 * 1024, // 2MB (over 1MB limit)
          totalJSHeapSize: 2048 * 1024,
          jsHeapSizeLimit: 4096 * 1024
        },
        writable: true
      })
      
      expect(monitor.checkResourceLimits()).toBe(false)
      
      const violations = monitor.getViolations()
      expect(violations).toHaveLength(1)
      expect(violations[0].type).toBe('memory_limit')
      expect(violations[0].severity).toBe('high')
      
      monitor.stopMonitoring()
    })
  })

  describe('recordViolation', () => {
    it('should record violations correctly', () => {
      monitor.recordViolation({
        type: 'timeout',
        message: 'Execution timeout',
        severity: 'high',
        metadata: { timeout: 5000 }
      })

      const violations = monitor.getViolations()
      expect(violations).toHaveLength(1)
      expect(violations[0].type).toBe('timeout')
      expect(violations[0].message).toBe('Execution timeout')
      expect(violations[0].severity).toBe('high')
      expect(violations[0].metadata?.timeout).toBe(5000)
      expect(violations[0].timestamp).toBeDefined()
    })

    it('should limit violations to 100 records', () => {
      // Record 101 violations
      for (let i = 0; i < 101; i++) {
        monitor.recordViolation({
          type: 'timeout',
          message: `Violation ${i}`,
          severity: 'low'
        })
      }

      const violations = monitor.getViolations()
      expect(violations).toHaveLength(100)
      expect(violations[0].message).toBe('Violation 1') // First one should be removed
      expect(violations[99].message).toBe('Violation 100') // Last one should remain
    })

    it('should stop execution on critical violations', () => {
      monitor.startMonitoring()
      
      // This should throw an error
      expect(() => {
        monitor.recordViolation({
          type: 'stack_overflow',
          message: 'Stack overflow detected',
          severity: 'critical'
        })
      }).toThrow('代码执行被安全监控阻止')
      
      monitor.stopMonitoring()
    })
  })

  describe('recordEvent', () => {
    it('should record events correctly', () => {
      monitor.recordEvent({
        type: 'analysis',
        code: 'console.log("test")',
        metadata: { result: 'safe' }
      })

      const events = monitor.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('analysis')
      expect(events[0].code).toBe('console.log("test")')
      expect(events[0].metadata?.result).toBe('safe')
      expect(events[0].id).toBeDefined()
      expect(events[0].timestamp).toBeDefined()
    })

    it('should limit events to 500 records', () => {
      // Record 501 events
      for (let i = 0; i < 501; i++) {
        monitor.recordEvent({
          type: 'analysis',
          code: `code ${i}`
        })
      }

      const events = monitor.getEvents()
      expect(events).toHaveLength(500)
      expect(events[0].code).toBe('code 1') // First one should be removed
      expect(events[499].code).toBe('code 500') // Last one should remain
    })
  })

  describe('getMetrics', () => {
    it('should provide correct metrics', () => {
      monitor.startMonitoring()
      
      // Record some violations and events
      monitor.recordViolation({
        type: 'timeout',
        message: 'Timeout',
        severity: 'high'
      })
      
      monitor.recordViolation({
        type: 'memory_limit',
        message: 'Memory limit',
        severity: 'medium'
      })
      
      monitor.stopMonitoring()

      const metrics = monitor.getMetrics()
      expect(metrics.totalViolations).toBe(2)
      expect(metrics.blockedExecutions).toBe(0)
      expect(metrics.violationTypes.timeout).toBe(1)
      expect(metrics.violationTypes.memory_limit).toBe(1)
      expect(metrics.riskLevelDistribution.high).toBe(1)
      expect(metrics.riskLevelDistribution.medium).toBe(1)
      expect(metrics.lastUpdated).toBeDefined()
    })
  })

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxExecutionTime: 2000,
        maxMemoryUsage: 2,
        blockedAPIs: ['eval', 'Function']
      }

      monitor.updateConfig(newConfig)
      
      // Test that new configuration is applied
      monitor.startMonitoring()
      expect(monitor.checkAPIAccess('eval')).toBe(false)
      expect(monitor.checkAPIAccess('Function')).toBe(false)
      monitor.stopMonitoring()
    })
  })

  describe('clear', () => {
    it('should clear all records', () => {
      monitor.startMonitoring()
      monitor.recordViolation({
        type: 'timeout',
        message: 'Test violation',
        severity: 'high'
      })
      monitor.recordEvent({
        type: 'analysis',
        code: 'test code'
      })
      monitor.stopMonitoring()

      expect(monitor.getViolations()).toHaveLength(1)
      expect(monitor.getEvents().length).toBeGreaterThanOrEqual(2)

      monitor.clear()

      expect(monitor.getViolations()).toHaveLength(0)
      expect(monitor.getEvents()).toHaveLength(0)
      
      const metrics = monitor.getMetrics()
      expect(metrics.totalViolations).toBe(0)
      expect(metrics.blockedExecutions).toBe(0)
    })
  })
})
