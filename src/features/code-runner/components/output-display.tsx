import { useMemo, useEffect, useRef } from 'react'
import { useCodeRunnerStore } from '../stores/code-runner-store'
import { useTheme } from '@/context/theme-provider'
import { StatusBar } from './status-bar'
import { EnhancedOutputLine } from './enhanced-output-line'

interface OutputDisplayProps {
  className?: string
}

export function OutputDisplay({ className }: OutputDisplayProps) {
  const { outputs, filter, searchTerm } = useCodeRunnerStore()
  const { resolvedTheme } = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

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

  // 自动滚动到底部
  useEffect(() => {
    if (shouldAutoScroll.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [filteredOutputs])

  // 监听用户滚动行为
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      // 如果用户滚动到接近底部（容差10px），则启用自动滚动
      shouldAutoScroll.current = scrollTop + clientHeight >= scrollHeight - 10
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>

      
      {/* 终端风格输出内容 */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 ${terminalTheme.background} ${terminalTheme.text} font-mono text-sm overflow-y-auto p-2`}
      >
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
                showTimestamp={true}
                showCheckbox={false}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 状态栏移到底部 */}
      <StatusBar />
    </div>
  )
}
