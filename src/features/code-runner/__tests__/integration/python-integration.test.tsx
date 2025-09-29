import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CodeRunner } from '../../index'
import { pythonSandboxManager } from '../../services/python-sandbox'

// Mock Pyodide
const mockPyodide = {
  runPython: vi.fn(),
  loadPackage: vi.fn(),
  globals: {
    get: vi.fn(),
    set: vi.fn()
  }
}

// Mock loadPyodide
vi.mock('pyodide', () => ({
  loadPyodide: vi.fn(() => Promise.resolve(mockPyodide))
}))

// Mock useCodeRunnerStore
const mockStore = {
  setExecutionState: vi.fn(),
  clearOutputs: vi.fn(),
  addOutput: vi.fn(),
  code: '',
  language: 'python',
  setLanguage: vi.fn(),
  setCode: vi.fn(),
  executionState: {
    isRunning: false,
    isPaused: false,
    executionId: null,
    startTime: null,
    timeoutId: null,
    executionTime: null,
    firstExecutionTime: null
  },
  compileState: {
    isCompiling: false,
    compileErrors: [],
    compileWarnings: [],
    compileTime: null,
    firstCompileTime: null
  },
  config: {
    timeout: 10000,
    maxMemory: 50,
    allowedAPIs: [],
    blockedAPIs: [],
    language: 'python' as const
  },
  getState: vi.fn(() => mockStore)
}

vi.mock('../../stores/code-runner-store', () => ({
  useCodeRunnerStore: Object.assign(() => mockStore, {
    getState: () => mockStore
  })
}))

// Mock simpleSandboxManager
vi.mock('../../services/simple-sandbox', () => ({
  simpleSandboxManager: {
    executeCode: vi.fn(),
    destroy: vi.fn()
  }
}))

describe('Python Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.language = 'python'
    mockStore.code = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Python Language Selection', () => {
    it('should display Python option in language selector', () => {
      render(<CodeRunner />)
      
      const languageSelector = screen.getByRole('combobox', { name: /语言/i })
      expect(languageSelector).toBeInTheDocument()
      
      // 点击语言选择器
      fireEvent.click(languageSelector)
      
      // 检查是否包含Python选项
      expect(screen.getByText('Python')).toBeInTheDocument()
    })

    it('should switch to Python language', async () => {
      render(<CodeRunner />)
      
      const languageSelector = screen.getByRole('combobox', { name: /语言/i })
      fireEvent.click(languageSelector)
      
      const pythonOption = screen.getByText('Python')
      fireEvent.click(pythonOption)
      
      expect(mockStore.setLanguage).toHaveBeenCalledWith('python')
    })
  })

  describe('Python Code Examples', () => {
    it('should load Python basic example', () => {
      render(<CodeRunner />)
      
      // 切换到Python语言
      mockStore.language = 'python'
      
      const exampleSelector = screen.getByRole('combobox', { name: /示例/i })
      fireEvent.click(exampleSelector)
      
      // 检查是否有Python示例选项
      expect(screen.getByText('Python基础语法')).toBeInTheDocument()
    })

    it('should load Python data science example', () => {
      render(<CodeRunner />)
      
      mockStore.language = 'python'
      
      const exampleSelector = screen.getByRole('combobox', { name: /示例/i })
      fireEvent.click(exampleSelector)
      
      expect(screen.getByText('数据分析示例')).toBeInTheDocument()
    })

    it('should load Python matplotlib example', () => {
      render(<CodeRunner />)
      
      mockStore.language = 'python'
      
      const exampleSelector = screen.getByRole('combobox', { name: /示例/i })
      fireEvent.click(exampleSelector)
      
      expect(screen.getByText('数据可视化示例')).toBeInTheDocument()
    })
  })

  describe('Python Code Execution', () => {
    it('should execute simple Python code', async () => {
      mockPyodide.runPython.mockReturnValue(undefined)
      
      render(<CodeRunner />)
      
      // 设置Python代码
      mockStore.code = 'print("Hello, Python!")'
      
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)
      
      await waitFor(() => {
        expect(mockStore.setExecutionState).toHaveBeenCalledWith(
          expect.objectContaining({
            isRunning: true,
            executionId: expect.any(String),
            startTime: expect.any(Number)
          })
        )
      })
    })

    it('should handle Python syntax errors', async () => {
      const syntaxError = new Error('SyntaxError: invalid syntax')
      mockPyodide.runPython.mockImplementation(() => {
        throw syntaxError
      })
      
      render(<CodeRunner />)
      
      mockStore.code = 'print("Hello, Python!"' // 缺少右括号
      
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)
      
      await waitFor(() => {
        expect(mockStore.addOutput).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('语法错误'),
            source: 'error'
          })
        )
      })
    })

    it('should handle Python runtime errors', async () => {
      const runtimeError = new Error('NameError: name "undefined_var" is not defined')
      mockPyodide.runPython.mockImplementation(() => {
        throw runtimeError
      })
      
      render(<CodeRunner />)
      
      mockStore.code = 'print(undefined_var)'
      
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)
      
      await waitFor(() => {
        expect(mockStore.addOutput).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('NameError'),
            source: 'error'
          })
        )
      })
    })

    it('should handle Python import errors', async () => {
      const importError = new Error("ModuleNotFoundError: No module named 'forbidden_module'")
      mockPyodide.runPython.mockImplementation(() => {
        throw importError
      })
      
      render(<CodeRunner />)
      
      mockStore.code = 'import forbidden_module'
      
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)
      
      await waitFor(() => {
        expect(mockStore.addOutput).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('模块导入错误'),
            source: 'error'
          })
        )
      })
    })
  })

  describe('Python Scientific Libraries', () => {
    it('should preload scientific packages on initialization', async () => {
      mockPyodide.loadPackage.mockResolvedValue(undefined)
      
      await pythonSandboxManager.initialize()
      
      expect(mockPyodide.loadPackage).toHaveBeenCalledWith('numpy')
      expect(mockPyodide.loadPackage).toHaveBeenCalledWith('pandas')
      expect(mockPyodide.loadPackage).toHaveBeenCalledWith('matplotlib')
    })

    it('should load additional scientific packages on demand', async () => {
      mockPyodide.loadPackage.mockResolvedValue(undefined)
      
      await pythonSandboxManager.initialize()
      
      const success = await pythonSandboxManager.loadScientificPackage('scipy')
      
      expect(success).toBe(true)
      expect(mockPyodide.loadPackage).toHaveBeenCalledWith('scipy')
    })

    it('should reject loading forbidden packages', async () => {
      await pythonSandboxManager.initialize()
      
      const success = await pythonSandboxManager.loadScientificPackage('os')
      
      expect(success).toBe(false)
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('不在允许的包列表中'),
          source: 'error'
        })
      )
    })

    it('should track loaded packages', async () => {
      mockPyodide.loadPackage.mockResolvedValue(undefined)
      
      await pythonSandboxManager.initialize()
      
      const loadedPackages = pythonSandboxManager.getLoadedPackages()
      expect(loadedPackages).toContain('numpy')
      expect(loadedPackages).toContain('pandas')
      expect(loadedPackages).toContain('matplotlib')
    })
  })

  describe('Python Output Handling', () => {
    it('should capture print output', async () => {
      // Mock the _send_output function
      mockPyodide.globals.set.mockImplementation((name, func) => {
        if (name === '_send_output') {
          // Simulate calling the function
          func('Hello, Python!', 'log')
        }
      })
      
      mockPyodide.runPython.mockReturnValue(undefined)
      
      await pythonSandboxManager.initialize()
      
      await pythonSandboxManager.executeCode('print("Hello, Python!")', mockStore.config)
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          message: 'Hello, Python!',
          source: 'console'
        })
      )
    })

    it('should format Python return values', async () => {
      mockPyodide.runPython.mockReturnValue(42)
      
      await pythonSandboxManager.initialize()
      
      await pythonSandboxManager.executeCode('42', mockStore.config)
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          message: '返回值: 42',
          source: 'console'
        })
      )
    })

    it('should handle complex Python data types', async () => {
      const complexData = [1, 2, 3, {'key': 'value'}]
      mockPyodide.runPython.mockReturnValue(complexData)
      
      await pythonSandboxManager.initialize()
      
      await pythonSandboxManager.executeCode('[1, 2, 3, {"key": "value"}]', mockStore.config)
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'log',
          message: expect.stringContaining('返回值:'),
          source: 'console'
        })
      )
    })
  })

  describe('Python Security', () => {
    it('should block dangerous modules', async () => {
      await pythonSandboxManager.initialize()
      
      mockStore.code = 'import os'
      
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)
      
      await waitFor(() => {
        expect(mockStore.addOutput).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('被安全策略禁止'),
            source: 'error'
          })
        )
      })
    })

    it('should allow safe modules', async () => {
      mockPyodide.runPython.mockReturnValue(undefined)
      
      await pythonSandboxManager.initialize()
      
      mockStore.code = 'import math\nprint(math.pi)'
      
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)
      
      await waitFor(() => {
        expect(mockPyodide.runPython).toHaveBeenCalled()
      })
    })
  })

  describe('Python Performance', () => {
    it('should handle execution timeout', async () => {
      // Mock setTimeout to immediately trigger timeout
      vi.useFakeTimers()
      
      mockPyodide.runPython.mockImplementation(() => {
        // Simulate long-running code
        return new Promise(() => {}) // Never resolves
      })
      
      await pythonSandboxManager.initialize()
      
      const executionPromise = pythonSandboxManager.executeCode(
        'import time; time.sleep(10)', 
        { ...mockStore.config, timeout: 100 }
      )
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(100)
      
      await executionPromise
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Python 代码执行超时',
          source: 'timeout'
        })
      )
      
      vi.useRealTimers()
    })

    it('should prevent concurrent execution', async () => {
      mockPyodide.runPython.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })
      
      await pythonSandboxManager.initialize()
      
      // Start first execution
      const firstExecution = pythonSandboxManager.executeCode('print("first")', mockStore.config)
      
      // Try to start second execution
      await pythonSandboxManager.executeCode('print("second")', mockStore.config)
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warn',
          message: 'Python 代码正在执行中，请等待完成后再试',
          source: 'system'
        })
      )
      
      // Wait for first execution to complete
      await firstExecution
    })
  })
})
