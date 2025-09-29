import { useMemo, useEffect, useRef } from 'react'
import { useCodeRunnerStore } from '../stores/code-runner-store'
import { useTheme } from '@/context/theme-provider'
import { StatusBar } from './status-bar'
import { EnhancedOutputLine } from './enhanced-output-line'
import { PageOutputLine } from './page-output-line'

interface OutputDisplayProps {
  className?: string
}

export function OutputDisplay({ className }: OutputDisplayProps) {
  const { outputs, filter, searchTerm, displayMode } = useCodeRunnerStore()
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

  // 获取主题感知的样式
  const getThemeStyles = () => {
    if (displayMode === 'terminal') {
      // 终端风格样式
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
    } else {
      // 页面风格样式
      return {
        background: 'bg-background',
        text: 'text-foreground',
        emptyText: 'text-muted-foreground'
      }
    }
  }

  const themeStyles = getThemeStyles()

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

      
      {/* 输出内容 */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto ${themeStyles.background} ${displayMode === 'terminal' ? `${themeStyles.text} font-mono text-sm p-2` : 'p-4'}`}
      >
        {filteredOutputs.length === 0 ? (
          <div className={`flex items-center justify-center h-32 ${themeStyles.emptyText}`}>
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
          <div className={displayMode === 'terminal' ? 'space-y-0' : 'space-y-0'}>
            {displayMode === 'terminal' ? (
              // 终端模式：按行显示
              filteredOutputs.map((output) => (
                <EnhancedOutputLine
                  key={output.id}
                  output={output}
                  showTimestamp={true}
                  showCheckbox={false}
                />
              ))
            ) : (
              // 页面模式：按时间顺序显示系统消息和代码执行结果
              <div className="space-y-3">
                {(() => {
                  // 按时间戳排序所有输出
                  const sortedOutputs = [...filteredOutputs].sort((a, b) => a.timestamp - b.timestamp)
                  
                  // 将连续的同类型输出合并成块
                  const outputBlocks: Array<{
                    type: 'system' | 'log' | 'error' | 'warn' | 'info'
                    outputs: typeof filteredOutputs
                    startTime: number
                  }> = []
                  
                  let currentBlock: typeof outputBlocks[0] | null = null
                  
                  sortedOutputs.forEach(output => {
                    const outputType = output.source === 'system' ? 'system' : 
                                     output.type === 'error' ? 'error' :
                                     output.type === 'warn' ? 'warn' :
                                     output.type === 'info' ? 'info' : 'log'
                    
                    if (!currentBlock || currentBlock.type !== outputType) {
                      // 开始新的块
                      currentBlock = {
                        type: outputType,
                        outputs: [output],
                        startTime: output.timestamp
                      }
                      outputBlocks.push(currentBlock)
                    } else {
                      // 添加到当前块
                      currentBlock.outputs.push(output)
                    }
                  })
                  
                  return outputBlocks.map((block, blockIndex) => (
                    <div key={`block-${blockIndex}-${block.startTime}`}>
                      {block.type === 'system' ? (
                        // 系统消息块
                        <div className="rounded-lg border p-4 bg-muted/30">
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground border-b pb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              系统消息 ({block.outputs.length} 条)
                            </div>
                            <div className="space-y-1">
                              {block.outputs.map((output) => (
                                <div key={output.id} className="text-sm text-muted-foreground italic">
                                  • {output.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : block.type === 'error' ? (
                        // 错误消息块
                        <div className="rounded-lg border p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground border-b pb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              错误 ({block.outputs.length} 条)
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed overflow-hidden text-red-700 dark:text-red-300">
                              {block.outputs.map((output, index) => (
                                <span key={output.id}>
                                  {output.message}
                                  {index < block.outputs.length - 1 ? '\n' : ''}
                                </span>
                              ))}
                            </pre>
                          </div>
                        </div>
                      ) : block.type === 'warn' ? (
                        // 警告消息块
                        <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground border-b pb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                              警告 ({block.outputs.length} 条)
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed overflow-hidden text-yellow-700 dark:text-yellow-300">
                              {block.outputs.map((output, index) => (
                                <span key={output.id}>
                                  {output.message}
                                  {index < block.outputs.length - 1 ? '\n' : ''}
                                </span>
                              ))}
                            </pre>
                          </div>
                        </div>
                      ) : block.type === 'info' ? (
                        // 信息消息块
                        <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground border-b pb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              信息 ({block.outputs.length} 条)
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed overflow-hidden text-blue-700 dark:text-blue-300">
                              {block.outputs.map((output, index) => (
                                <span key={output.id}>
                                  {output.message}
                                  {index < block.outputs.length - 1 ? '\n' : ''}
                                </span>
                              ))}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        // 代码执行结果块 (log类型)
                        <div className="rounded-lg border p-4 bg-card">
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground border-b pb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              代码执行结果 ({block.outputs.length} 条输出)
                            </div>
                            {(() => {
                              // 检查是否包含HTML内容
                              const combinedOutput = block.outputs.map(output => output.message).join('\n')
                              const hasHtmlContent = /<[^>]+>/g.test(combinedOutput)
                              
                              if (hasHtmlContent) {
                                // 渲染HTML内容
                                return (
                                  <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground italic mb-2">
                                      HTML 渲染结果：
                                    </div>
                                    <div 
                                      className="border rounded p-3 bg-white dark:bg-gray-900 overflow-auto"
                                      dangerouslySetInnerHTML={{ __html: combinedOutput }}
                                    />
                                    <details className="mt-2">
                                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                        查看原始HTML代码
                                      </summary>
                                      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed overflow-hidden mt-2 p-2 bg-muted/30 rounded">
                                        {combinedOutput}
                                      </pre>
                                    </details>
                                  </div>
                                )
                              } else {
                                // 普通文本输出
                                return (
                                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed overflow-hidden">
                                    {block.outputs.map((output, index) => (
                                      <span key={output.id}>
                                        {output.message}
                                        {index < block.outputs.length - 1 ? '\n' : ''}
                                      </span>
                                    ))}
                                  </pre>
                                )
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 状态栏移到底部 */}
      <StatusBar />
    </div>
  )
}
