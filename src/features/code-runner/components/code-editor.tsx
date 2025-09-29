import { Editor } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useTheme } from '@/context/theme-provider'
import { useCodeRunnerStore } from '../stores/code-runner-store'

export function CodeEditor() {
  const { code, setCode, language } = useCodeRunnerStore()

  const { resolvedTheme } = useTheme()

  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor
  ) => {
    // 设置编辑器选项
    editorInstance.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    })

    // 监听窗口大小变化
    const handleResize = () => {
      editorInstance.layout()
    }

    window.addEventListener('resize', handleResize)

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
    }
  }

  return (
    <div className='flex h-full flex-col'>
      {/* 编辑器 */}
      <div className='relative flex-1' data-testid='code-editor-container'>
        <Editor
          height='100%'
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme={resolvedTheme === 'light' ? 'vs-light' : 'vs-dark'}
          options={{
            readOnly: false,
            selectOnLineNumbers: true,
            roundedSelection: false,
            cursorStyle: 'line',
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
            contextmenu: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
            },
          }}
        />
      </div>

      {/* 状态栏已移除 - 避免与页面底部统计信息重复 */}
    </div>
  )
}
