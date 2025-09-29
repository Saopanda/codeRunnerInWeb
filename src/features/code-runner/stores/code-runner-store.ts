import { create } from 'zustand'

export interface CodeOutput {
  id: string
  type: 'log' | 'error' | 'warn' | 'info'
  message: string
  timestamp: number
  source: 'console' | 'error' | 'timeout' | 'security' | 'system'
}

export interface CodeExecutionState {
  isRunning: boolean
  isPaused: boolean
  executionId: string | null
  startTime: number | null
  timeoutId: number | null
  executionTime: number | null
  firstExecutionTime: number | null
}


export interface SandboxConfig {
  timeout: number // 执行超时时间（毫秒）
  maxMemory: number // 最大内存使用（MB）
  allowedAPIs: string[] // 允许的API列表
  blockedAPIs: string[] // 禁止的API列表
}

export type Language = 'javascript' | 'typescript' | 'php' | 'python'

export interface CompileState {
  isCompiling: boolean
  compileErrors: string[]
  compileWarnings: string[]
  compileTime: number | null
  firstCompileTime: number | null
}

interface CodeRunnerState {
  // 代码相关
  code: string
  setCode: (code: string) => void
  resetFirstTimes: () => void
  
  // 语言相关
  language: Language
  setLanguage: (language: Language) => void
  
  // 执行状态
  executionState: CodeExecutionState
  setExecutionState: (state: Partial<CodeExecutionState>) => void
  
  // 编译状态
  compileState: CompileState
  setCompileState: (state: Partial<CompileState>) => void
  
  // 输出相关
  outputs: CodeOutput[]
  addOutput: (output: Omit<CodeOutput, 'id' | 'timestamp'>) => void
  clearOutputs: () => void
  
  // 输出过滤和搜索
  filter: 'all' | 'log' | 'error' | 'warn' | 'info' | 'system'
  setFilter: (filter: 'all' | 'log' | 'error' | 'warn' | 'info' | 'system') => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  
  // 显示模式
  displayMode: 'terminal' | 'page'
  setDisplayMode: (mode: 'terminal' | 'page') => void
  selectedOutputs: string[]
  toggleOutputSelection: (id: string) => void
  clearSelection: () => void
  
  // 配置相关
  config: SandboxConfig
  updateConfig: (config: Partial<SandboxConfig>) => void
  
}

const defaultConfig: SandboxConfig = {
  timeout: 10000, // 10秒
  maxMemory: 50, // 50MB
  allowedAPIs: [
    'console.log', 'console.error', 'console.warn', 'console.info',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'Promise', 'async/await',
    'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite'
  ],
  blockedAPIs: [
    'eval', 'Function', 'import', 'require', 'module', 'exports',
    'document', 'window', 'localStorage', 'sessionStorage',
    'XMLHttpRequest', 'fetch', 'WebSocket', 'Worker'
  ]
}


export const useCodeRunnerStore = create<CodeRunnerState>((set) => ({
  // 代码相关
  code: 'console.log("Hello, World!");\nconsole.log("欢迎使用代码运行器！");',
  setCode: (code) => set((prev) => {
    // 如果代码发生变化，重置首次时间
    if (prev.code !== code) {
      return {
        code,
        executionState: {
          ...prev.executionState,
          firstExecutionTime: null
        },
        compileState: {
          ...prev.compileState,
          firstCompileTime: null
        }
      }
    }
    return { code }
  }),
  resetFirstTimes: () => set((prev) => ({
    executionState: {
      ...prev.executionState,
      firstExecutionTime: null
    },
    compileState: {
      ...prev.compileState,
      firstCompileTime: null
    }
  })),
  
  // 语言相关
  language: 'javascript',
  setLanguage: (language) => set((_prev) => {
    // 如果切换到JavaScript，清理编译状态
    if (language === 'javascript') {
      return {
        language,
        compileState: {
          isCompiling: false,
          compileErrors: [],
          compileWarnings: [],
          compileTime: null,
          firstCompileTime: null
        }
      }
    }
    // 如果切换到PHP，清理编译状态（PHP不需要编译）
    if (language === 'php') {
      return {
        language,
        compileState: {
          isCompiling: false,
          compileErrors: [],
          compileWarnings: [],
          compileTime: null,
          firstCompileTime: null
        }
      }
    }
    return { language }
  }),
  
  // 执行状态
  executionState: {
    isRunning: false,
    isPaused: false,
    executionId: null,
    startTime: null,
    timeoutId: null,
    executionTime: null,
    firstExecutionTime: null
  },
  setExecutionState: (state) => set((prev) => ({
    executionState: { ...prev.executionState, ...state }
  })),
  
  // 编译状态
  compileState: {
    isCompiling: false,
    compileErrors: [],
    compileWarnings: [],
    compileTime: null,
    firstCompileTime: null
  },
  setCompileState: (state) => set((prev) => ({
    compileState: { ...prev.compileState, ...state }
  })),
  
  // 输出相关
  outputs: [],
  addOutput: (output) => set((prev) => ({
    outputs: [...prev.outputs, {
      ...output,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }]
  })),
  clearOutputs: () => set({ outputs: [] }),
  
  // 输出过滤和搜索
  filter: 'all',
  setFilter: (filter) => set({ filter }),
  searchTerm: '',
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  
  // 显示模式
  displayMode: 'terminal',
  setDisplayMode: (mode) => set({ displayMode: mode }),
  
  selectedOutputs: [],
  toggleOutputSelection: (id) => set((prev) => ({
    selectedOutputs: prev.selectedOutputs.includes(id)
      ? prev.selectedOutputs.filter(selectedId => selectedId !== id)
      : [...prev.selectedOutputs, id]
  })),
  clearSelection: () => set({ selectedOutputs: [] }),
  
  // 配置相关
  config: defaultConfig,
  updateConfig: (config) => set((prev) => ({
    config: { ...prev.config, ...config }
  })),
  
}))
