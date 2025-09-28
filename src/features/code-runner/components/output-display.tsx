import { useMemo } from 'react'
import { useCodeRunnerStore } from '../stores/code-runner-store'
import { useTheme } from '@/context/theme-provider'
import { StatusBar } from './status-bar'
import { OutputToolbar } from './output-toolbar'
import { EnhancedOutputLine } from './enhanced-output-line'

interface OutputDisplayProps {
  className?: string
}

export function OutputDisplay({ className }: OutputDisplayProps) {
  const { outputs, filter, searchTerm, selectedOutputs, toggleOutputSelection } = useCodeRunnerStore()
  const { resolvedTheme } = useTheme()

  // 过滤输出
  const filteredOutputs = useMemo(() => {
    return outputs.filter(output => {
      let matchesFilter = false
      if (filter === 'all') {
        matchesFilter = true
      } else if (filter === 'system') {
        matchesFilter = output.source === 'system'
      } else {
        matchesFilter = output.type === filter && output.source !== 'system'
      }
      
      const matchesSearch = searchTerm === '' || 
        output.message.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [outputs, filter, searchTerm])

  // 获取主题感知的终端样式
  const getTerminalTheme = () => {
    if (resolvedTheme === 'dark') {
      return {
        background: 'bg-black',
        text: 'text-green-400',
        emptyText: 'text-gray-400'
      }
    } else {
      return {
        background: 'bg-gray-50',
        text: 'text-green-600',
        emptyText: 'text-gray-500'
      }
    }
  }

  const terminalTheme = getTerminalTheme()

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 状态栏 */}
      <StatusBar />
      
      {/* 工具栏 */}
      <OutputToolbar />
      
      {/* 终端风格输出内容 */}
      <div className={`flex-1 ${terminalTheme.background} ${terminalTheme.text} font-mono text-sm overflow-y-auto`}>
        <div className="min-h-64">
          {filteredOutputs.length === 0 ? (
            <div className={`flex items-center justify-center h-32 ${terminalTheme.emptyText}`}>
              <div className="text-center">
                {outputs.length === 0 ? (
                  <>
                    <div className="text-lg mb-2">🚀</div>
                    <div>等待执行代码...</div>
                    <div className="text-xs mt-1 opacity-60">点击运行按钮开始执行</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg mb-2">🔍</div>
                    <div>没有匹配的输出</div>
                    <div className="text-xs mt-1 opacity-60">
                      {filter !== 'all' && `当前过滤: ${filter}`}
                      {searchTerm && `搜索: "${searchTerm}"`}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredOutputs.map((output) => (
                <EnhancedOutputLine
                  key={output.id}
                  output={output}
                  isSelected={selectedOutputs.includes(output.id)}
                  onToggleSelect={toggleOutputSelection}
                  showTimestamp={true}
                  showCheckbox={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
