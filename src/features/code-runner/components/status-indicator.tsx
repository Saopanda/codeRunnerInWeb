import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

interface StatusIndicatorProps {
  type: 'compile' | 'execution'
  status: 'idle' | 'running' | 'success' | 'error'
  time?: number | null
}

export function StatusIndicator({ type, status, time }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return { 
          icon: <Loader2 className="h-3 w-3 animate-spin" />, 
          text: '进行中...', 
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
        }
      case 'success':
        return { 
          icon: <CheckCircle className="h-3 w-3" />, 
          text: '完成', 
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
        }
      case 'error':
        return { 
          icon: <XCircle className="h-3 w-3" />, 
          text: '失败', 
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
        }
      default:
        return { 
          icon: <Clock className="h-3 w-3" />, 
          text: '等待', 
          className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' 
        }
    }
  }
  
  const config = getStatusConfig()
  const displayName = type === 'compile' ? '编译' : '执行'
  
  return (
    <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${config.className}`}>
      {config.icon}
      <span>{displayName}</span>
      <span>{config.text}</span>
      {time !== null && time !== undefined && (
        <span className="font-mono">({time}ms)</span>
      )}
    </div>
  )
}