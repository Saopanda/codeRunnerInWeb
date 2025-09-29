import { XCircle, AlertTriangle, Info, Terminal, Settings } from 'lucide-react'
import type { CodeOutput } from '../stores/code-runner-store'

interface PageOutputLineProps {
  output: CodeOutput
  showTimestamp?: boolean
}

export function PageOutputLine({
  output,
  showTimestamp = true,
}: PageOutputLineProps) {
  const getOutputIcon = (type: string, source: string) => {
    // 系统消息使用特殊图标
    if (source === 'system') {
      return <Settings className='h-4 w-4 flex-shrink-0 text-purple-500' />
    }

    switch (type) {
      case 'error':
        return <XCircle className='h-4 w-4 flex-shrink-0 text-red-500' />
      case 'warn':
        return (
          <AlertTriangle className='h-4 w-4 flex-shrink-0 text-yellow-500' />
        )
      case 'info':
        return <Info className='h-4 w-4 flex-shrink-0 text-blue-500' />
      default:
        return <Terminal className='h-4 w-4 flex-shrink-0 text-green-500' />
    }
  }

  const getCardStyle = (type: string, source: string) => {
    // 系统消息使用特殊样式
    if (source === 'system') {
      return 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
    }

    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      case 'warn':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
    }
  }

  const getTextColor = (type: string, source: string) => {
    // 系统消息使用特殊颜色和样式
    if (source === 'system') {
      return 'text-purple-700 dark:text-purple-300'
    }

    switch (type) {
      case 'error':
        return 'text-red-700 dark:text-red-300'
      case 'warn':
        return 'text-yellow-700 dark:text-yellow-300'
      case 'info':
        return 'text-blue-700 dark:text-blue-300'
      default:
        return 'text-green-700 dark:text-green-300'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // 安全地处理可能包含HTML的输出内容
  const getSafeContent = (message: string) => {
    // 对于系统消息，直接返回
    if (output.source === 'system') {
      return message
    }

    // 对于其他输出，确保HTML标签被转义显示而不是被解析
    return message
  }

  return (
    <div
      className={`mb-2 rounded-lg border p-3 ${getCardStyle(output.type, output.source)}`}
    >
      <div className='flex items-start gap-2'>
        {getOutputIcon(output.type, output.source)}
        <div className='min-w-0 flex-1'>
          <div
            className={`text-sm ${getTextColor(output.type, output.source)}`}
          >
            <pre className='overflow-hidden font-sans break-words whitespace-pre-wrap'>
              {getSafeContent(output.message)}
            </pre>
          </div>
          {showTimestamp && (
            <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              {formatTimestamp(output.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
