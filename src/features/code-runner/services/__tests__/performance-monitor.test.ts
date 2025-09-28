import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PerformanceMonitor } from '../performance-monitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
  })

  describe('startTiming', () => {
    it('should measure timing correctly', async () => {
      const stopTiming = monitor.startTiming('test-operation')
      
      // 模拟一些异步操作
      await new Promise(resolve => setTimeout(resolve, 10))
      
      stopTiming()
      
      const metrics = monitor.getMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0].name).toBe('test-operation')
      expect(metrics[0].duration).toBeGreaterThan(5)
      expect(metrics[0].type).toBe('timing')
    })

    it('should support different metric types', () => {
      const stopTiming = monitor.startTiming('compilation', 'compilation')
      stopTiming()
      
      const metrics = monitor.getMetrics()
      expect(metrics[0].type).toBe('compilation')
    })
  })

  describe('recordMetric', () => {
    it('should record custom metrics', () => {
      monitor.recordMetric({
        name: 'custom-metric',
        duration: 100,
        timestamp: Date.now(),
        type: 'execution',
        metadata: { customData: 'test' }
      })
      
      const metrics = monitor.getMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0].name).toBe('custom-metric')
      expect(metrics[0].duration).toBe(100)
      expect(metrics[0].metadata?.customData).toBe('test')
    })

    it('should limit metrics to max size', () => {
      const monitor = new PerformanceMonitor()
      
      // 添加超过最大数量的指标
      for (let i = 0; i < 150; i++) {
        monitor.recordMetric({
          name: `metric-${i}`,
          duration: i,
          timestamp: Date.now(),
          type: 'timing'
        })
      }
      
      const metrics = monitor.getMetrics()
      expect(metrics).toHaveLength(100) // 应该限制在100个
      expect(metrics[0].name).toBe('metric-50') // 最早的50个应该被移除
    })
  })

  describe('getMetricsByType', () => {
    it('should filter metrics by type', () => {
      monitor.recordMetric({
        name: 'compilation-1',
        duration: 50,
        timestamp: Date.now(),
        type: 'compilation'
      })
      
      monitor.recordMetric({
        name: 'execution-1',
        duration: 100,
        timestamp: Date.now(),
        type: 'execution'
      })
      
      monitor.recordMetric({
        name: 'compilation-2',
        duration: 75,
        timestamp: Date.now(),
        type: 'compilation'
      })
      
      const compilationMetrics = monitor.getMetricsByType('compilation')
      const executionMetrics = monitor.getMetricsByType('execution')
      
      expect(compilationMetrics).toHaveLength(2)
      expect(executionMetrics).toHaveLength(1)
      expect(compilationMetrics.every(m => m.type === 'compilation')).toBe(true)
    })
  })

  describe('getAverageTime', () => {
    it('should calculate average time correctly', () => {
      monitor.recordMetric({
        name: 'test-operation',
        duration: 100,
        timestamp: Date.now(),
        type: 'timing'
      })
      
      monitor.recordMetric({
        name: 'test-operation',
        duration: 200,
        timestamp: Date.now(),
        type: 'timing'
      })
      
      monitor.recordMetric({
        name: 'test-operation',
        duration: 300,
        timestamp: Date.now(),
        type: 'timing'
      })
      
      const average = monitor.getAverageTime('test-operation')
      expect(average).toBe(200) // (100 + 200 + 300) / 3
    })

    it('should return 0 for non-existent metrics', () => {
      const average = monitor.getAverageTime('non-existent')
      expect(average).toBe(0)
    })
  })

  describe('getPerformanceReport', () => {
    it('should generate comprehensive performance report', () => {
      // 添加一些测试指标
      monitor.recordMetric({
        name: 'typescript-compile',
        duration: 50,
        timestamp: Date.now(),
        type: 'compilation'
      })
      
      monitor.recordMetric({
        name: 'code-execution',
        duration: 100,
        timestamp: Date.now(),
        type: 'execution'
      })
      
      monitor.recordMetric({
        name: 'memory-usage',
        duration: 0,
        timestamp: Date.now(),
        type: 'memory',
        metadata: { memoryUsage: 0.5 }
      })
      
      const report = monitor.getPerformanceReport()
      
      expect(report.compilationTime).toBe(50)
      expect(report.executionTime).toBe(100)
      expect(report.memoryUsage).toBe(0.5)
      expect(report.totalOperations).toBe(3)
      expect(report.averageResponseTime).toBe(50) // (50 + 100 + 0) / 3
    })
  })

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      monitor.recordMetric({
        name: 'test',
        duration: 100,
        timestamp: Date.now(),
        type: 'timing'
      })
      
      expect(monitor.getMetrics()).toHaveLength(1)
      
      monitor.clearMetrics()
      
      expect(monitor.getMetrics()).toHaveLength(0)
    })
  })

  describe('listeners', () => {
    it('should notify listeners when metrics are recorded', () => {
      const listener = vi.fn()
      const removeListener = monitor.addListener(listener)
      
      monitor.recordMetric({
        name: 'test',
        duration: 100,
        timestamp: Date.now(),
        type: 'timing'
      })
      
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test',
          duration: 100,
          type: 'timing'
        })
      )
      
      removeListener()
      
      monitor.recordMetric({
        name: 'test2',
        duration: 200,
        timestamp: Date.now(),
        type: 'timing'
      })
      
      expect(listener).toHaveBeenCalledTimes(1) // 不应该再被调用
    })
  })

  describe('execution monitoring', () => {
    it('should monitor code execution', () => {
      const stopMonitoring = monitor.startExecutionMonitoring('console.log("test")', 'javascript')
      stopMonitoring()
      
      const metrics = monitor.getMetricsByType('execution')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].metadata?.codeLength).toBe(19)
      expect(metrics[0].metadata?.language).toBe('javascript')
    })
  })

  describe('compilation monitoring', () => {
    it('should monitor compilation', () => {
      const testCode = 'const x: string = "test"'
      const stopMonitoring = monitor.startCompilationMonitoring(testCode, 'typescript')
      stopMonitoring()
      
      const metrics = monitor.getMetricsByType('compilation')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].metadata?.codeLength).toBe(testCode.length)
      expect(metrics[0].metadata?.language).toBe('typescript')
      expect(metrics[0].metadata?.cacheHit).toBe(false)
    })
  })
})
