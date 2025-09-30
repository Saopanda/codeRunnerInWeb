/**
 * 测试工具函数 - 适配 CI/CD 环境
 *
 * 这些工具函数帮助测试在不同环境（本地开发、GitHub Actions 等）中保持一致性
 */
import { vi, expect } from 'vitest'

/**
 * 创建稳定的时间戳用于测试
 * 使用固定的 UTC 时间，避免时区问题
 */
export function createStableTimestamp(dateString?: string): number {
  // 默认使用固定的 UTC 时间: 2023-01-01 12:00:00 UTC
  const defaultDate = '2023-01-01T12:00:00.000Z'
  return new Date(dateString || defaultDate).getTime()
}

/**
 * 模拟稳定的时区环境
 * 用于需要特定时区的测试
 */
export function mockTimezone(timezone = 'UTC') {
  const originalTZ = process.env.TZ
  process.env.TZ = timezone

  return () => {
    if (originalTZ !== undefined) {
      process.env.TZ = originalTZ
    } else {
      delete process.env.TZ
    }
  }
}

/**
 * 创建时间戳正则表达式匹配器
 * 适配不同时区和格式
 */
export const timePatterns = {
  // 24小时格式: HH:MM:SS
  time24: /\d{2}:\d{2}:\d{2}/,
  // 12小时格式: HH:MM:SS AM/PM
  time12: /\d{1,2}:\d{2}:\d{2}\s*(AM|PM)/i,
  // 任意时间格式
  timeAny: /\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM))?/i,
}

/**
 * 创建稳定的 Date.now() mock
 * 用于需要一致时间的测试
 */
export function createStableDateNow(fixedTime?: number) {
  const timestamp = fixedTime || createStableTimestamp()
  return vi.spyOn(Date, 'now').mockReturnValue(timestamp)
}

/**
 * 等待 DOM 更新的工具函数
 * 帮助处理异步渲染的测试
 */
export function waitForDOMUpdate(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 创建时区无关的时间匹配器
 * 返回一个函数，用于测试时间是否符合预期格式
 */
export function createTimezoneSafeMatcher(options?: {
  format?: '24h' | '12h' | 'any'
  allowEmpty?: boolean
}) {
  const { format = 'any', allowEmpty = false } = options || {}

  return {
    toMatchTimeFormat: (received: string) => {
      if (allowEmpty && !received) {
        return { pass: true, message: () => 'Empty time string allowed' }
      }

      let pattern: RegExp
      switch (format) {
        case '24h':
          pattern = timePatterns.time24
          break
        case '12h':
          pattern = timePatterns.time12
          break
        default:
          pattern = timePatterns.timeAny
      }

      const pass = pattern.test(received)
      return {
        pass,
        message: () =>
          pass
            ? `Expected "${received}" not to match time format`
            : `Expected "${received}" to match time format ${pattern}`,
      }
    },
  }
}

/**
 * CI 环境检测
 */
export const isCI = Boolean(
  process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS
)

/**
 * 为 CI 环境优化的测试配置
 */
export const ciOptimizedConfig = {
  // CI 环境中增加超时时间
  timeout: isCI ? 10000 : 5000,
  // CI 环境中的重试次数
  retries: isCI ? 2 : 0,
  // CI 环境中的等待时间
  waitTime: isCI ? 100 : 50,
}

/**
 * 创建适合 CI 的时间戳测试工具
 */
export function createCIFriendlyTimeTest() {
  return {
    /**
     * 检查元素是否包含有效的时间格式
     */
    expectTimeFormat: (element: HTMLElement) => {
      const timeText = element.textContent || ''
      expect(timeText).toMatch(timePatterns.timeAny)
    },

    /**
     * 检查时间戳是否在合理范围内
     */
    expectReasonableTimestamp: (timestamp: number) => {
      const now = Date.now()
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000
      const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000

      expect(timestamp).toBeGreaterThan(oneYearAgo)
      expect(timestamp).toBeLessThan(oneYearFromNow)
    },

    /**
     * 创建稳定的测试时间戳
     */
    createTestTimestamp: (offsetHours = 0) => {
      const baseTime = createStableTimestamp()
      return baseTime + offsetHours * 60 * 60 * 1000
    },
  }
}
