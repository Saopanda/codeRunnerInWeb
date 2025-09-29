/**
 * 日志工具类
 * 用于替代直接的console语句，提供更好的日志管理
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO

  setLogLevel(level: LogLevel) {
    this.logLevel = level
  }

  debug(message: string, ...args: unknown[]) {
    if (this.logLevel <= LogLevel.DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.logLevel <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.logLevel <= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.logLevel <= LogLevel.ERROR) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, ...args)
    }
  }

  // 专门用于开发环境的日志
  dev(message: string, ...args: unknown[]) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[DEV] ${message}`, ...args)
    }
  }

  // 用于性能监控的日志
  perf(message: string, ...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(`[PERF] ${message}`, ...args)
  }
}

export const logger = new Logger()

// 在开发环境下设置更详细的日志级别
if (import.meta.env.DEV) {
  logger.setLogLevel(LogLevel.DEBUG)
}
