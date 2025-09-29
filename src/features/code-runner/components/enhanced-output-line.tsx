import { XCircle, AlertTriangle, Info, Terminal, Settings } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { CodeOutput } from '../stores/code-runner-store'

interface EnhancedOutputLineProps {
  output: CodeOutput
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  showTimestamp?: boolean
  showCheckbox?: boolean
}

export function EnhancedOutputLine({
  output,
  isSelected = false,
  onToggleSelect,
  showTimestamp = true,
  showCheckbox = false,
}: EnhancedOutputLineProps) {
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

  const getTextColor = (type: string, source: string) => {
    // 系统消息使用特殊颜色和样式
    if (source === 'system') {
      return 'text-purple-600 dark:text-purple-400 italic'
    }

    switch (type) {
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-foreground'
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

  // 系统消息的特殊样式
  const isSystemMessage = output.source === 'system'
  const containerClass = isSystemMessage
    ? `flex items-start space-x-2 py-2 px-3 hover:bg-muted/20 transition-colors border-l-2 border-purple-400 bg-purple-50/30 dark:bg-purple-900/10 ${
        isSelected ? 'bg-muted/40' : ''
      }`
    : `flex items-start space-x-2 py-2 px-3 hover:bg-muted/20 transition-colors ${
        isSelected ? 'bg-muted/40' : ''
      }`

  return (
    <div className={containerClass}>
      {showCheckbox && onToggleSelect && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(output.id)}
          className='mt-1 flex-shrink-0'
        />
      )}

      {showTimestamp && (
        <span className='mt-1 min-w-[80px] flex-shrink-0 font-mono text-xs opacity-60'>
          {formatTimestamp(output.timestamp)}
        </span>
      )}

      <div className='mt-1 flex-shrink-0'>
        {getOutputIcon(output.type, output.source)}
      </div>

      <div
        className={`flex-1 overflow-hidden font-mono text-sm leading-relaxed break-words whitespace-pre-wrap ${getTextColor(output.type, output.source)}`}
      >
        {isSystemMessage && (
          <span className='mr-2 text-xs opacity-70'>[系统]</span>
        )}
        {output.message}
      </div>

      {output.source && (
        <span className='mt-1 flex-shrink-0 text-xs opacity-40'>
          [{output.source}]
        </span>
      )}
    </div>
  )
}
