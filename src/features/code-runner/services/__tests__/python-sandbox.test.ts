import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PythonSandboxManager } from '../python-sandbox'

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
  addOutput: vi.fn()
}

vi.mock('../../stores/code-runner-store', () => ({
  useCodeRunnerStore: {
    getState: () => mockStore
  }
}))

describe('PythonSandboxManager', () => {
  let pythonSandbox: PythonSandboxManager

  beforeEach(() => {
    pythonSandbox = new PythonSandboxManager()
    vi.clearAllMocks()
  })

  afterEach(() => {
    pythonSandbox.destroy()
  })

  describe('初始化', () => {
    it('应该成功初始化Python环境', async () => {
      await pythonSandbox.initialize()
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: '正在初始化 Python 环境...',
          source: 'system'
        })
      )
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: 'Python 环境初始化完成',
          source: 'system'
        })
      )
    })

    it('应该设置安全限制', async () => {
      await pythonSandbox.initialize()
      
      expect(mockPyodide.runPython).toHaveBeenCalledWith(
        expect.stringContaining('blocked_modules')
      )
    })

    it('应该处理初始化错误', async () => {
      const error = new Error('初始化失败')
      vi.mocked(require('pyodide').loadPyodide).mockRejectedValueOnce(error)
      
      await expect(pythonSandbox.initialize()).rejects.toThrow('初始化失败')
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Python 环境初始化失败: 初始化失败',
          source: 'error'
        })
      )
    })
  })

  describe('代码执行', () => {
    beforeEach(async () => {
      await pythonSandbox.initialize()
    })

    it('应该成功执行Python代码', async () => {
      const code = 'print("Hello, World!")'
      const config = { timeout: 5000, maxMemory: 50, allowedAPIs: [], blockedAPIs: [], language: 'python' as const }
      
      mockPyodide.runPython.mockReturnValue(undefined)
      
      await pythonSandbox.executeCode(code, config)
      
      expect(mockStore.setExecutionState).toHaveBeenCalledWith(
        expect.objectContaining({
          isRunning: true,
          executionId: expect.any(String),
          startTime: expect.any(Number)
        })
      )
      
      expect(mockStore.clearOutputs).toHaveBeenCalled()
      expect(mockPyodide.runPython).toHaveBeenCalledWith(expect.stringContaining(code))
    })

    it('应该处理执行错误', async () => {
      const code = 'invalid python syntax'
      const config = { timeout: 5000, maxMemory: 50, allowedAPIs: [], blockedAPIs: [], language: 'python' as const }
      
      const error = new Error('语法错误')
      mockPyodide.runPython.mockImplementation(() => {
        throw error
      })
      
      await expect(pythonSandbox.executeCode(code, config)).rejects.toThrow('语法错误')
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Python 执行错误: 语法错误',
          source: 'error'
        })
      )
    })

    it('应该防止并发执行', async () => {
      const code = 'print("test")'
      const config = { timeout: 5000, maxMemory: 50, allowedAPIs: [], blockedAPIs: [], language: 'python' as const }
      
      // 第一次执行
      const firstExecution = pythonSandbox.executeCode(code, config)
      
      // 第二次执行应该被阻止
      await pythonSandbox.executeCode(code, config)
      
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warn',
          message: 'Python 代码正在执行中，请等待完成后再试',
          source: 'system'
        })
      )
      
      // 等待第一次执行完成
      await firstExecution
    })

    it('应该处理执行超时', async () => {
      const code = 'import time; time.sleep(10)'
      const config = { timeout: 100, maxMemory: 50, allowedAPIs: [], blockedAPIs: [], language: 'python' as const }
      
      // Mock setTimeout to immediately trigger timeout
      vi.useFakeTimers()
      
      const executionPromise = pythonSandbox.executeCode(code, config)
      
      // 快进时间触发超时
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
  })

  describe('包管理', () => {
    beforeEach(async () => {
      await pythonSandbox.initialize()
    })

    it('应该成功加载包', async () => {
      mockPyodide.loadPackage.mockResolvedValue(undefined)
      
      const result = await pythonSandbox.loadPackage('numpy')
      
      expect(result).toBe(true)
      expect(mockPyodide.loadPackage).toHaveBeenCalledWith('numpy')
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          message: '正在加载包: numpy',
          source: 'system'
        })
      )
    })

    it('应该处理包加载失败', async () => {
      const error = new Error('包不存在')
      mockPyodide.loadPackage.mockRejectedValue(error)
      
      const result = await pythonSandbox.loadPackage('nonexistent')
      
      expect(result).toBe(false)
      expect(mockStore.addOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: '包加载失败: nonexistent - 包不存在',
          source: 'error'
        })
      )
    })

    it('应该检查包是否被允许', () => {
      expect(pythonSandbox.isPackageAllowed('numpy')).toBe(true)
      expect(pythonSandbox.isPackageAllowed('os')).toBe(false)
    })

    it('应该返回可用包列表', () => {
      const packages = pythonSandbox.getAvailablePackages()
      expect(packages).toContain('numpy')
      expect(packages).toContain('pandas')
      expect(packages).toContain('math')
    })
  })

  describe('状态管理', () => {
    it('应该返回正确的状态', () => {
      const status = pythonSandbox.getStatus()
      
      expect(status).toEqual({
        isRunning: false,
        isReady: false,
        executionId: null,
        startTime: 0,
        hasPyodide: false
      })
    })

    it('应该停止执行', () => {
      pythonSandbox.stopExecution()
      
      expect(mockStore.setExecutionState).toHaveBeenCalledWith({
        isRunning: false,
        isPaused: false,
        executionId: null,
        startTime: null,
        timeoutId: null
      })
    })

    it('应该销毁实例', () => {
      pythonSandbox.destroy()
      
      const status = pythonSandbox.getStatus()
      expect(status.hasPyodide).toBe(false)
      expect(status.isReady).toBe(false)
    })
  })

  describe('输出格式化', () => {
    it('应该正确格式化Python输出', () => {
      const pythonSandbox = new PythonSandboxManager()
      
      // 测试各种数据类型的格式化
      expect((pythonSandbox as any).formatPythonOutput(null)).toBe('None')
      expect((pythonSandbox as any).formatPythonOutput(undefined)).toBe('undefined')
      expect((pythonSandbox as any).formatPythonOutput('hello')).toBe('"hello"')
      expect((pythonSandbox as any).formatPythonOutput(123)).toBe('123')
      expect((pythonSandbox as any).formatPythonOutput(true)).toBe('True')
      expect((pythonSandbox as any).formatPythonOutput([1, 2, 3])).toBe('[1, 2, 3]')
    })

    it('应该正确格式化Python错误', () => {
      const pythonSandbox = new PythonSandboxManager()
      
      const error = new Error('测试错误')
      expect((pythonSandbox as any).formatPythonError(error)).toBe('测试错误')
      
      expect((pythonSandbox as any).formatPythonError('字符串错误')).toBe('字符串错误')
      expect((pythonSandbox as any).formatPythonError({})).toBe('未知错误')
    })
  })
})
