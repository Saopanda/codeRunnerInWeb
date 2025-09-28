import { useCodeRunnerStore } from '../stores/code-runner-store'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

export function StatusBar() {
  const { compileState, executionState } = useCodeRunnerStore()

  const formatTime = (time: number | null) => {
    if (time === null) return '--'
    if (time < 1000) return `${Math.round(time)}ms`
    return `${(time / 1000).toFixed(1)}s`
  }

  const getCompileStatus = () => {
    if (compileState.isCompiling) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: '编译中...',
        variant: 'secondary' as const,
        time: null
      }
    }
    
    if (compileState.compileErrors.length > 0) {
      return {
        icon: <XCircle className="h-3 w-3" />,
        text: '编译失败',
        variant: 'destructive' as const,
        time: compileState.compileTime
      }
    }
    
    if (compileState.compileTime !== null) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: '编译完成',
        variant: 'default' as const,
        time: compileState.compileTime
      }
    }
    
    return {
      icon: <Clock className="h-3 w-3" />,
      text: '等待编译',
      variant: 'outline' as const,
      time: null
    }
  }

  const getExecutionStatus = () => {
    if (executionState.isRunning) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: '执行中...',
        variant: 'secondary' as const,
        time: null
      }
    }
    
    if (executionState.executionTime !== null) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: '执行完成',
        variant: 'default' as const,
        time: executionState.executionTime
      }
    }
    
    return {
      icon: <Clock className="h-3 w-3" />,
      text: '等待执行',
      variant: 'outline' as const,
      time: null
    }
  }

  const compileStatus = getCompileStatus()
  const executionStatus = getExecutionStatus()

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b text-xs">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Badge variant={compileStatus.variant} className="flex items-center space-x-1">
            {compileStatus.icon}
            <span>{compileStatus.text}</span>
            {compileStatus.time && (
              <span className="text-xs opacity-75">
                ({formatTime(compileStatus.time)})
              </span>
            )}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={executionStatus.variant} className="flex items-center space-x-1">
            {executionStatus.icon}
            <span>{executionStatus.text}</span>
            {executionStatus.time && (
              <span className="text-xs opacity-75">
                ({formatTime(executionStatus.time)})
              </span>
            )}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-muted-foreground">
        {compileState.firstCompileTime && (
          <span>首次编译: {formatTime(compileState.firstCompileTime)}</span>
        )}
        {executionState.firstExecutionTime && (
          <span>首次执行: {formatTime(executionState.firstExecutionTime)}</span>
        )}
      </div>
    </div>
  )
}
