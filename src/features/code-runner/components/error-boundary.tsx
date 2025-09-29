import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react'
import { logger } from '@/lib/logger'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
  retryCount: number
}

/**
 * 代码运行器错误边界组件
 * 捕获并处理React组件树中的JavaScript错误
 */
export class CodeRunnerErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Code Runner Error Boundary:', error, errorInfo)

    this.setState({ error, errorInfo })

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 发送错误报告
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    // 如果子组件发生变化且当前有错误，重置错误状态
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: 0,
      })
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      errorBoundary: 'CodeRunnerErrorBoundary',
    }

    // 在开发环境下打印详细错误信息
    if (process.env.NODE_ENV === 'development') {
      logger.dev('🚨 Code Runner Error Report')
      logger.error('Error:', error)
      logger.error('Error Info:', errorInfo)
      logger.dev('Error Report:', errorReport)
    }

    // 这里可以集成错误收集服务（如 Sentry）
    // sendErrorToService(errorReport)

    // 存储到本地存储以便调试
    try {
      const existingErrors = JSON.parse(
        localStorage.getItem('code-runner-errors') || '[]'
      )
      existingErrors.push(errorReport)

      // 只保留最近10个错误
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10)
      }

      localStorage.setItem('code-runner-errors', JSON.stringify(existingErrors))
    } catch (e) {
      logger.warn('Failed to store error report:', e)
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
      }))
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private getErrorSeverity = (): 'low' | 'medium' | 'high' | 'critical' => {
    const { error } = this.state
    if (!error) return 'low'

    const message = error.message.toLowerCase()

    // 关键错误
    if (
      message.includes('chunk load') ||
      message.includes('loading') ||
      message.includes('network')
    ) {
      return 'critical'
    }

    // 高优先级错误
    if (
      message.includes('undefined') ||
      message.includes('null') ||
      message.includes('reference')
    ) {
      return 'high'
    }

    // 中等优先级错误
    if (
      message.includes('type') ||
      message.includes('property') ||
      message.includes('method')
    ) {
      return 'medium'
    }

    return 'low'
  }

  private getErrorType = (): string => {
    const { error } = this.state
    if (!error) return 'Unknown'

    const message = error.message.toLowerCase()

    if (message.includes('chunk load')) return 'Chunk Load Error'
    if (message.includes('loading')) return 'Loading Error'
    if (message.includes('network')) return 'Network Error'
    if (message.includes('undefined')) return 'Undefined Error'
    if (message.includes('null')) return 'Null Reference Error'
    if (message.includes('type')) return 'Type Error'
    if (message.includes('property')) return 'Property Error'
    if (message.includes('method')) return 'Method Error'

    return 'Runtime Error'
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      const severity = this.getErrorSeverity()
      const errorType = this.getErrorType()
      const { error, retryCount } = this.state
      const canRetry = retryCount < this.maxRetries

      const severityColors = {
        low: 'bg-blue-50 border-blue-200 text-blue-800',
        medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        high: 'bg-orange-50 border-orange-200 text-orange-800',
        critical: 'bg-red-50 border-red-200 text-red-800',
      }

      const severityIcons = {
        low: 'ℹ️',
        medium: '⚠️',
        high: '🚨',
        critical: '💥',
      }

      return (
        <div className='bg-background flex min-h-screen items-center justify-center p-4'>
          <Card className='w-full max-w-2xl'>
            <CardHeader className='text-center'>
              <div className='mb-4 flex items-center justify-center'>
                <div className={`rounded-full p-3 ${severityColors[severity]}`}>
                  <AlertTriangle className='h-8 w-8' />
                </div>
              </div>
              <CardTitle className='text-2xl font-bold'>
                {severityIcons[severity]} 代码运行器遇到错误
              </CardTitle>
              <CardDescription>
                很抱歉，代码运行器遇到了一个意外错误。请尝试以下解决方案。
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* 错误信息 */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant={
                      severity === 'critical' ? 'destructive' : 'secondary'
                    }
                  >
                    {errorType}
                  </Badge>
                  <Badge variant='outline'>
                    严重程度: {severity.toUpperCase()}
                  </Badge>
                  {this.state.errorId && (
                    <Badge variant='outline' className='text-xs'>
                      ID: {this.state.errorId.slice(-8)}
                    </Badge>
                  )}
                </div>

                {error && (
                  <div className='bg-muted rounded-lg p-3'>
                    <p className='font-mono text-sm break-words'>
                      {error.message}
                    </p>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className='flex flex-wrap justify-center gap-3'>
                {canRetry && (
                  <Button onClick={this.handleRetry} variant='default'>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    重试 ({this.maxRetries - retryCount} 次剩余)
                  </Button>
                )}

                <Button onClick={this.handleReload} variant='outline'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  刷新页面
                </Button>

                <Button onClick={this.handleGoHome} variant='ghost'>
                  <Home className='mr-2 h-4 w-4' />
                  返回首页
                </Button>
              </div>

              {/* 错误详情 */}
              {this.props.showDetails && this.state.errorInfo && (
                <details className='mt-4'>
                  <summary className='text-muted-foreground hover:text-foreground cursor-pointer text-sm font-medium'>
                    <Bug className='mr-1 inline h-4 w-4' />
                    查看技术详情
                  </summary>
                  <div className='bg-muted mt-2 rounded-lg p-3'>
                    <pre className='max-h-40 overflow-auto text-xs'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* 帮助信息 */}
              <div className='text-muted-foreground text-center text-sm'>
                <p>如果问题持续存在，请尝试清除浏览器缓存或联系技术支持。</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className='mt-2 font-mono text-xs'>
                    开发模式 - 详细错误信息已记录到控制台
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <CodeRunnerErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </CodeRunnerErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Hook: 获取错误边界状态
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}
