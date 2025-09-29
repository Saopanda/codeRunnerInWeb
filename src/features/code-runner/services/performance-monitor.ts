/**
 * 性能监控服务
 * 用于监控代码执行性能、编译性能等关键指标
 */
import { logger } from '@/lib/logger'

export interface PerformanceMetric {
  id: string
  name: string
  duration: number
  timestamp: number
  type: 'timing' | 'memory' | 'execution' | 'compilation'
  metadata?: Record<string, unknown>
}

export interface PerformanceReport {
  compilationTime: number
  executionTime: number
  memoryUsage: number
  cacheHitRate: number
  totalOperations: number
  averageResponseTime: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 100
  private listeners: Array<(metric: PerformanceMetric) => void> = []

  /**
   * 开始计时
   * @param name 计时器名称
   * @param type 指标类型
   * @returns 停止计时的函数，返回持续时间
   */
  startTiming(
    name: string,
    type: PerformanceMetric['type'] = 'timing'
  ): () => number {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        type,
        metadata: {
          startTime,
          endTime,
        },
      })

      return duration
    }
  }

  /**
   * 记录性能指标
   * @param metric 性能指标
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id'>): void {
    const newMetric: PerformanceMetric = {
      ...metric,
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    this.metrics.push(newMetric)

    // 保持最近 100 条记录
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // 通知监听器
    this.notifyListeners(newMetric)

    // 发送到分析服务（如果需要）
    this.sendMetric(newMetric)
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * 获取指定类型的指标
   */
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter((m) => m.type === type)
  }

  /**
   * 获取平均执行时间
   */
  getAverageTime(metricName: string): number {
    const relevantMetrics = this.metrics.filter((m) => m.name === metricName)
    if (relevantMetrics.length === 0) return 0

    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / relevantMetrics.length
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): PerformanceReport {
    const compilationMetrics = this.getMetricsByType('compilation')
    const memoryMetrics = this.getMetricsByType('memory')

    const compilationTime = this.getAverageTime('typescript-compile')
    const executionTime = this.getAverageTime('code-execution')

    // 计算内存使用（如果有相关指标）
    const memoryUsage =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce(
            (sum, m) => sum + ((m.metadata?.memoryUsage as number) || 0),
            0
          ) / memoryMetrics.length
        : 0

    // 计算缓存命中率（从编译指标中推断）
    const cacheMetrics = compilationMetrics.filter((m) => m.metadata?.cacheHit)
    const cacheHitRate =
      compilationMetrics.length > 0
        ? (cacheMetrics.length / compilationMetrics.length) * 100
        : 0

    const totalOperations = this.metrics.length
    const averageResponseTime =
      totalOperations > 0
        ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations
        : 0

    return {
      compilationTime,
      executionTime,
      memoryUsage,
      cacheHitRate,
      totalOperations,
      averageResponseTime,
    }
  }

  /**
   * 清空所有指标
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * 添加指标监听器
   */
  addListener(listener: (metric: PerformanceMetric) => void): () => void {
    this.listeners.push(listener)

    // 返回移除监听器的函数
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(metric: PerformanceMetric): void {
    this.listeners.forEach((listener) => {
      try {
        listener(metric)
      } catch (error) {
        logger.error('Performance monitor listener error:', error)
      }
    })
  }

  /**
   * 发送指标到分析服务
   */
  private sendMetric(metric: PerformanceMetric): void {
    // 这里可以集成第三方分析服务
    // 例如：Google Analytics, Mixpanel, 自定义后端等

    if (process.env.NODE_ENV === 'development') {
      logger.dev('Performance Metric:', metric)
    }

    // 示例：发送到自定义分析端点
    // this.sendToAnalytics(metric)
  }

  /**
   * 监控内存使用情况
   */
  monitorMemory(): void {
    if ('memory' in performance) {
      const memory = (
        performance as {
          memory: {
            usedJSHeapSize: number
            totalJSHeapSize: number
            jsHeapSizeLimit: number
          }
        }
      ).memory
      this.recordMetric({
        name: 'memory-usage',
        duration: 0,
        timestamp: Date.now(),
        type: 'memory',
        metadata: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
        },
      })
    }
  }

  /**
   * 开始监控代码执行性能
   */
  startExecutionMonitoring(code: string, language: string): () => number {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordMetric({
        name: 'code-execution',
        duration,
        timestamp: Date.now(),
        type: 'execution',
        metadata: {
          codeLength: code.length,
          language,
          linesOfCode: code.split('\n').length,
        },
      })

      return duration
    }
  }

  /**
   * 开始监控编译性能
   */
  startCompilationMonitoring(code: string, language: string): () => number {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.recordMetric({
        name: 'typescript-compile',
        duration,
        timestamp: Date.now(),
        type: 'compilation',
        metadata: {
          codeLength: code.length,
          language,
          cacheHit: false, // 这个值应该在编译器中设置
        },
      })

      return duration
    }
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor()

// 定期监控内存使用
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.monitorMemory()
  }, 30000) // 每30秒监控一次内存
}
