import { useEffect, lazy, Suspense } from 'react'
import { useCodeRunnerStore } from './stores/code-runner-store'
import { useTheme } from '@/context/theme-provider'
import { simpleSandboxManager } from './services/simple-sandbox'
import { CodeRunnerErrorBoundary } from './components/error-boundary'
import { EditorStatusBar } from './components/editor-status-bar'
import { OutputFilters } from './components/output-filters'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Code, Play, Settings, Github, Moon, Sun, Loader2, Trash2, Square, Code2, FileText } from 'lucide-react'
import { typescriptExamples } from './examples/typescript-examples'
import { phpExamples } from './examples/php-examples'
import { pythonExamples } from './examples/python-examples'

// 懒加载组件
const CodeEditor = lazy(() => import('./components/code-editor').then(module => ({ default: module.CodeEditor })))
const OutputDisplay = lazy(() => import('./components/output-display').then(module => ({ default: module.OutputDisplay })))

// 加载状态组件
const LoadingSpinner = ({ message = "加载中..." }: { message?: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
)

export function CodeRunner() {
  const { 
    code, 
    language,
    setLanguage,
    setCode,
    executionState, 
    compileState,
    config,
    clearOutputs
  } = useCodeRunnerStore()
  
  const { resolvedTheme, setTheme } = useTheme()



  useEffect(() => {
    // 清理函数
    return () => {
      simpleSandboxManager.destroy()
    }
  }, [])

  const handleRun = async () => {
    if (!code.trim()) {
      return
    }

    try {
      await simpleSandboxManager.executeCode(code, config, language)
    } catch (_error) {
      // 错误处理已在沙箱管理器中处理
    }
  }

  const handleStop = () => {
    simpleSandboxManager.stopExecution()
  }


  const handleThemeToggle = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const handleClearOutputs = () => {
    clearOutputs()
  }

  const handleLanguageChange = (newLanguage: 'javascript' | 'typescript' | 'php') => {
    setLanguage(newLanguage)
  }

  const handleExampleSelect = (exampleKey: string) => {
    // 调试测试代码
    let debugTest = ''

    if (language === 'php') {
      debugTest = `<?php
echo "Hello PHP!";
echo "\n欢迎使用 PHP 脚本运行器！\n";

// 变量和数据类型
$name = "PHP";
$version = 8.1;
$isAwesome = true;

echo "语言: " . $name . "\n";
echo "版本: " . $version . "\n";
echo "很棒: " . ($isAwesome ? "是" : "否") . "\n";
?>`
    } else if (language === 'python') {
      debugTest = `# Python 基础示例
print("Hello Python!")
print("欢迎使用 Python 代码运行器！")

# 变量和数据类型
name = "Python"
version = 3.11
is_awesome = True

print(f"语言: {name}")
print(f"版本: {version}")
print(f"很棒: {is_awesome}")

# 列表操作
numbers = [1, 2, 3, 4, 5]
print(f"数字列表: {numbers}")
print(f"列表长度: {len(numbers)}")`
    } else {
      debugTest = `console.log("Hello ${language === 'typescript' ? 'TypeScript' : 'JavaScript'}!");

const message = "测试消息";
const number = 123;

console.log("字符串:", message);
console.log("数字:", number);

function test() {
  console.log("函数执行成功");
}

test();`
    }

    if (exampleKey === 'debug') {
      setCode(debugTest)
    } else if (language === 'typescript' && typescriptExamples[exampleKey as keyof typeof typescriptExamples]) {
      setCode(typescriptExamples[exampleKey as keyof typeof typescriptExamples])
    } else if (language === 'php' && phpExamples[exampleKey as keyof typeof phpExamples]) {
      setCode(phpExamples[exampleKey as keyof typeof phpExamples])
    } else if (language === 'python' && pythonExamples[exampleKey as keyof typeof pythonExamples]) {
      setCode(pythonExamples[exampleKey as keyof typeof pythonExamples])
    }
  }

  return (
    <CodeRunnerErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <div className="flex flex-col h-screen bg-background">
      {/* 头部 */}
      <header className="flex items-center justify-between p-4 border-b bg-muted/50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Code className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">在线脚本代码运行器</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 语言选择器 */}
          <div className="flex items-center space-x-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 示例选择器 */}
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Select onValueChange={handleExampleSelect}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择示例" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debug">调试测试</SelectItem>
                {language === 'typescript' && (
                  <>
                    <SelectItem value="simple">简单测试</SelectItem>
                    <SelectItem value="basic">基础类型</SelectItem>
                    <SelectItem value="interfaces">接口</SelectItem>
                    <SelectItem value="generics">泛型</SelectItem>
                    <SelectItem value="classes">类</SelectItem>
                    <SelectItem value="async">异步</SelectItem>
                    <SelectItem value="errorHandling">错误处理</SelectItem>
                  </>
                )}
                {language === 'php' && (
                  <>
                    <SelectItem value="simple">简单示例</SelectItem>
                    <SelectItem value="basic">基础语法</SelectItem>
                    <SelectItem value="functions">函数示例</SelectItem>
                    <SelectItem value="arrays">数组操作</SelectItem>
                    <SelectItem value="classes">面向对象</SelectItem>
                    <SelectItem value="errorHandling">错误处理</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleThemeToggle}
            variant="outline"
            size="icon"
            className="h-10 w-10"
          >
            {resolvedTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
          >
            <Github className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：代码编辑器 */}
        <div className="flex-1 flex flex-col border-r min-h-0">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span className="font-medium">代码编辑器</span>
            </div>
            <Button
              onClick={executionState.isRunning || compileState.isCompiling ? handleStop : handleRun}
              disabled={executionState.isRunning || compileState.isCompiling ? false : !code.trim()}
              variant={executionState.isRunning || compileState.isCompiling ? "destructive" : "default"}
              size="sm"
              className="flex items-center space-x-1"
            >
              {compileState.isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>编译</span>
                </>
              ) : executionState.isRunning ? (
                <>
                  <Square className="h-4 w-4" />
                  <span>停止</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>运行</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <Suspense fallback={<LoadingSpinner message="加载代码编辑器..." />}>
              <CodeEditor />
            </Suspense>
          </div>
          {/* 编辑器状态栏移到底部 */}
          <EditorStatusBar />
        </div>

        {/* 右侧：输出结果 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span className="font-medium">输出结果</span>
            </div>
            <div className="flex items-center space-x-3">
              {/* 筛选控件 */}
              <OutputFilters />
              <Button
                onClick={handleClearOutputs}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>清空</span>
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Suspense fallback={<LoadingSpinner message="加载输出面板..." />}>
              <OutputDisplay />
            </Suspense>
          </div>
        </div>
      </main>


      </div>
    </CodeRunnerErrorBoundary>
  )
}
