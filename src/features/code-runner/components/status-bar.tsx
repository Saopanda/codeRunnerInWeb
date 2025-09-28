import { useCodeRunnerStore } from '../stores/code-runner-store'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

export function StatusBar() {
  const { compileState, executionState, outputs, language } = useCodeRunnerStore()

  const formatTime = (time: number | null) => {
    if (time === null) return '--'
    if (time < 1000) return `${Math.round(time)}ms`
    return `${(time / 1000).toFixed(1)}s`
  }

  // 获取内存使用情况
  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number } }).memory
      return Math.round(memory.usedJSHeapSize / 1024 / 1024)
    }
    return 0
  }

  const getCompileStatus = () => {
    if (compileState?.isCompiling) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: '编译中...',
        time: null
      }
    }
    
    if (compileState?.compileErrors?.length > 0) {
      return {
        icon: <XCircle className="h-3 w-3" />,
        text: '编译失败',
        time: compileState?.compileTime
      }
    }
    
    if (compileState?.compileTime !== null) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: '编译完成',
        time: compileState?.compileTime
      }
    }
    
    return {
      icon: <Clock className="h-3 w-3" />,
      text: '等待编译',
      time: null
    }
  }

  const getExecutionStatus = () => {
    if (executionState.isRunning) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: '执行中...',
        time: null
      }
    }
    
    if (executionState.executionTime !== null) {
      return {
        icon: <CheckCircle className="h-3 w-3" />,
        text: '执行完成',
        time: executionState.executionTime
      }
    }
    
    return {
      icon: <Clock className="h-3 w-3" />,
      text: '等待执行',
      time: null
    }
  }

  const compileStatus = getCompileStatus()
  const executionStatus = getExecutionStatus()
  
  // 判断当前语言是否需要编译
  const needsCompilation = language === 'typescript'

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
      <div className="flex items-center space-x-4">
        {needsCompilation && (
          <span className="flex items-center space-x-1">
            {compileStatus.icon}
            <span>{compileStatus.text}</span>
            {compileStatus.time && (
              <span className="opacity-75">
                ({formatTime(compileStatus.time)})
              </span>
            )}
          </span>
        )}
        
        <span className="flex items-center space-x-1">
          {executionStatus.icon}
          <span>{executionStatus.text}</span>
          {executionStatus.time && (
            <span className="opacity-75">
              ({formatTime(executionStatus.time)})
            </span>
          )}
        </span>
      </div>
      
      <div className="flex items-center space-x-4">
        <span>内存: {getMemoryUsage()}MB</span>
        <span>输出: {outputs.length}条</span>
        {needsCompilation && compileState?.firstCompileTime && (
          <span>首次编译: {formatTime(compileState.firstCompileTime)}</span>
        )}
        {executionState.firstExecutionTime && (
          <span>首次执行: {formatTime(executionState.firstExecutionTime)}</span>
        )}
      </div>
    </div>
  )
}
