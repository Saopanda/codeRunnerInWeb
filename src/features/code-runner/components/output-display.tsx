import { useCodeRunnerStore } from '../stores/code-runner-store'
import { useTheme } from '@/context/theme-provider'

interface OutputDisplayProps {
  className?: string
}

export function OutputDisplay({ className }: OutputDisplayProps) {
  const { outputs } = useCodeRunnerStore()
  const { resolvedTheme } = useTheme()

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
      {/* 终端风格输出内容 */}
      <div className={`flex-1 ${terminalTheme.background} ${terminalTheme.text} font-mono text-sm overflow-y-auto`}>
        <div className="p-4 min-h-64">
          {outputs.length === 0 ? (
            <div className={`terminal-line ${terminalTheme.emptyText}`}>
              <div className="whitespace-pre-wrap break-words">
                等待执行...
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {outputs.map((output) => (
                <div
                  key={output.id}
                  className={`terminal-line ${
                    output.type === 'error' ? (resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600') :
                    output.type === 'warn' ? (resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') :
                    output.type === 'info' ? (resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600') :
                    (resolvedTheme === 'dark' ? 'text-white' : 'text-gray-800')
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {output.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
