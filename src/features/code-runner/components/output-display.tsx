import { useMemo, useEffect, useRef } from 'react'
import { useTheme } from '@/context/theme-provider'
import { useCodeRunnerStore } from '../stores/code-runner-store'
import { EnhancedOutputLine } from './enhanced-output-line'
import { StatusBar } from './status-bar'

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
    return outputs.filter((output) => {
      let matchesFilter = false
      if (filter === 'all') {
        matchesFilter = true
      } else if (filter === 'system') {
        matchesFilter = output.source === 'system'
      } else {
        matchesFilter = output.type === filter && output.source !== 'system'
      }

      const matchesSearch =
        searchTerm === '' ||
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
          emptyText: 'text-gray-400',
        }
      } else {
        return {
          background: 'bg-gray-50',
          text: 'text-green-600',
          emptyText: 'text-gray-500',
        }
      }
    } else {
      // 页面风格样式
      return {
        background: 'bg-background',
        text: 'text-foreground',
        emptyText: 'text-muted-foreground',
      }
    }
  }

  const themeStyles = getThemeStyles()

  // 自动滚动到底部
  useEffect(() => {
    if (shouldAutoScroll.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [filteredOutputs])

  // 监听用户滚动行为
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current
      // 如果用户滚动到接近底部（容差10px），则启用自动滚动
      shouldAutoScroll.current = scrollTop + clientHeight >= scrollHeight - 10
    }
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* 输出内容 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto ${themeStyles.background} ${displayMode === 'terminal' ? `${themeStyles.text} p-2 font-mono text-sm` : 'p-4'}`}
      >
        {filteredOutputs.length === 0 ? (
          <div
            className={`flex h-32 items-center justify-center ${themeStyles.emptyText}`}
          >
            <div className='text-center'>
              {outputs.length === 0 ? (
                <>
                  <div className='mb-2 text-lg'>🚀</div>
                  <div>等待执行代码...</div>
                  <div className='mt-1 text-xs opacity-60'>
                    点击运行按钮开始执行
                  </div>
                </>
              ) : (
                <>
                  <div className='mb-2 text-lg'>🔍</div>
                  <div>没有匹配的输出</div>
                  <div className='mt-1 text-xs opacity-60'>
                    {filter !== 'all' && `当前过滤: ${filter}`}
                    {searchTerm && `搜索: "${searchTerm}"`}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            className={displayMode === 'terminal' ? 'space-y-0' : 'space-y-0'}
          >
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
              <div className='space-y-3'>
                {(() => {
                  // 按时间戳排序所有输出
                  const sortedOutputs = [...filteredOutputs].sort(
                    (a, b) => a.timestamp - b.timestamp
                  )

                  // 将连续的同类型输出合并成块
                  const outputBlocks: Array<{
                    type: 'system' | 'log' | 'error' | 'warn' | 'info'
                    outputs: typeof filteredOutputs
                    startTime: number
                  }> = []

                  let currentBlock: (typeof outputBlocks)[0] | null = null

                  sortedOutputs.forEach((output) => {
                    const outputType =
                      output.source === 'system'
                        ? 'system'
                        : output.type === 'error'
                          ? 'error'
                          : output.type === 'warn'
                            ? 'warn'
                            : output.type === 'info'
                              ? 'info'
                              : 'log'

                    if (!currentBlock || currentBlock.type !== outputType) {
                      // 开始新的块
                      currentBlock = {
                        type: outputType,
                        outputs: [output],
                        startTime: output.timestamp,
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
                        <div className='bg-muted/30 rounded-lg border p-4'>
                          <div className='space-y-2'>
                            <div className='text-muted-foreground flex items-center gap-2 border-b pb-2 text-xs'>
                              <span className='h-2 w-2 rounded-full bg-blue-500'></span>
                              系统消息 ({block.outputs.length} 条)
                            </div>
                            <div className='space-y-1'>
                              {block.outputs.map((output) => (
                                <div
                                  key={output.id}
                                  className='text-muted-foreground text-sm italic'
                                >
                                  • {output.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : block.type === 'error' ? (
                        // 错误消息块
                        <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20'>
                          <div className='space-y-2'>
                            <div className='text-muted-foreground flex items-center gap-2 border-b pb-2 text-xs'>
                              <span className='h-2 w-2 rounded-full bg-red-500'></span>
                              错误 ({block.outputs.length} 条)
                            </div>
                            <pre className='overflow-hidden font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-red-700 dark:text-red-300'>
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
                        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20'>
                          <div className='space-y-2'>
                            <div className='text-muted-foreground flex items-center gap-2 border-b pb-2 text-xs'>
                              <span className='h-2 w-2 rounded-full bg-yellow-500'></span>
                              警告 ({block.outputs.length} 条)
                            </div>
                            <pre className='overflow-hidden font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-yellow-700 dark:text-yellow-300'>
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
                        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20'>
                          <div className='space-y-2'>
                            <div className='text-muted-foreground flex items-center gap-2 border-b pb-2 text-xs'>
                              <span className='h-2 w-2 rounded-full bg-blue-500'></span>
                              信息 ({block.outputs.length} 条)
                            </div>
                            <pre className='overflow-hidden font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-blue-700 dark:text-blue-300'>
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
                        <div className='bg-card rounded-lg border p-4'>
                          <div className='space-y-2'>
                            <div className='text-muted-foreground flex items-center gap-2 border-b pb-2 text-xs'>
                              <span className='h-2 w-2 rounded-full bg-green-500'></span>
                              代码执行结果 ({block.outputs.length} 条输出)
                            </div>
                            {(() => {
                              // 检查是否包含HTML内容
                              const combinedOutput = block.outputs
                                .map((output) => output.message)
                                .join('\n')
                              const hasHtmlContent = /<[^>]+>/g.test(
                                combinedOutput
                              )

                              if (hasHtmlContent) {
                                // 渲染HTML内容
                                return (
                                  <div className='space-y-2'>
                                    <div className='text-muted-foreground mb-2 text-xs italic'>
                                      HTML 渲染结果：
                                    </div>
                                    <div
                                      className='overflow-auto rounded border bg-white p-3 dark:bg-gray-900'
                                      dangerouslySetInnerHTML={{
                                        __html: combinedOutput,
                                      }}
                                    />
                                    <details className='mt-2'>
                                      <summary className='text-muted-foreground hover:text-foreground cursor-pointer text-xs'>
                                        查看原始HTML代码
                                      </summary>
                                      <pre className='bg-muted/30 mt-2 overflow-hidden rounded p-2 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap'>
                                        {combinedOutput}
                                      </pre>
                                    </details>
                                  </div>
                                )
                              } else {
                                // 普通文本输出
                                return (
                                  <pre className='overflow-hidden font-mono text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                    {block.outputs.map((output, index) => (
                                      <span key={output.id}>
                                        {output.message}
                                        {index < block.outputs.length - 1
                                          ? '\n'
                                          : ''}
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
