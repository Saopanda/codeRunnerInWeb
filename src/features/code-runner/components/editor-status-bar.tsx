import { useCodeRunnerStore } from '../stores/code-runner-store'
import { Code } from 'lucide-react'

export function EditorStatusBar() {
  const { code, language } = useCodeRunnerStore()

  // 获取语言显示名称
  const getLanguageDisplayName = () => {
    switch (language) {
      case 'typescript':
        return 'TypeScript'
      case 'php':
        return 'PHP'
      case 'javascript':
      default:
        return 'JavaScript'
    }
  }

  // 计算代码统计信息
  const codeLength = code.length
  const lineCount = code.split('\n').length
  const wordCount = code.trim() ? code.trim().split(/\s+/).length : 0

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <Code className="h-3 w-3" />
          <span>{getLanguageDisplayName()}</span>
        </span>
        <span>{codeLength} 字符</span>
        <span>{lineCount} 行</span>
        <span>{wordCount} 词</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <span>编码: UTF-8</span>
        <span>缩进: 2 空格</span>
      </div>
    </div>
  )
}