import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock worker environment
const mockPostMessage = vi.fn()
const mockImportPyodide = vi.fn()
const mockPyodide = {
  globals: {
    set: vi.fn(),
  },
  runPython: vi.fn(),
  runPythonAsync: vi.fn(),
  loadPackage: vi.fn(),
  ffi: {
    toJs: vi.fn(),
  },
}

// Mock global objects for worker environment
Object.assign(globalThis, {
  postMessage: mockPostMessage,
  self: {
    onmessage: null,
  },
})

// Mock dynamic import
vi.mock('pyodide', () => ({
  loadPyodide: mockImportPyodide,
}))

describe('Python Worker', () => {
  let onMessageHandler: ((ev: MessageEvent) => void) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mockImportPyodide.mockResolvedValue(mockPyodide)

    // Reset the worker module
    vi.resetModules()

    // Mock self.onmessage assignment
    Object.defineProperty(globalThis.self, 'onmessage', {
      set: (handler) => {
        onMessageHandler = handler
      },
      configurable: true,
    })
  })

  it('handles INIT message correctly', async () => {
    // Import the worker module to trigger initialization
    await import('../python-worker')

    const initMessage = {
      type: 'INIT' as const,
      payload: {
        pyodideConfig: {
          indexURL: 'test-url',
          fullStdLib: true,
          packages: ['numpy'],
        },
        maxRecursionDepth: 1000,
      },
    }

    // Simulate message event
    if (onMessageHandler) {
      await onMessageHandler({ data: initMessage } as MessageEvent)
    }

    expect(mockImportPyodide).toHaveBeenCalledWith(
      initMessage.payload.pyodideConfig
    )
    expect(mockPyodide.runPython).toHaveBeenCalled()
    expect(mockPyodide.globals.set).toHaveBeenCalledWith(
      '_send_output',
      expect.any(Function)
    )
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'READY' })
  })

  it('handles execution timeout correctly', async () => {
    await import('../python-worker')

    // Initialize first
    const initMessage = {
      type: 'INIT' as const,
      payload: {
        pyodideConfig: { indexURL: 'test-url' },
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: initMessage } as MessageEvent)
    }

    // Mock a long-running execution
    mockPyodide.runPythonAsync.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10000))
    )

    const executeMessage = {
      type: 'EXECUTE' as const,
      payload: {
        executionId: 'test-exec-timeout',
        code: 'while True: pass',
        timeoutMs: 100,
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: executeMessage } as MessageEvent)
    }

    // Should post error due to timeout
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ERROR',
      payload: {
        executionId: 'test-exec-timeout',
        error: 'Python代码执行超时',
      },
    })
  })

  it('handles LOAD_PACKAGE message correctly', async () => {
    await import('../python-worker')

    // Initialize first
    const initMessage = {
      type: 'INIT' as const,
      payload: {
        pyodideConfig: { indexURL: 'test-url' },
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: initMessage } as MessageEvent)
    }

    const loadPackageMessage = {
      type: 'LOAD_PACKAGE' as const,
      payload: { name: 'numpy' },
    }

    mockPyodide.loadPackage.mockResolvedValue(undefined)

    if (onMessageHandler) {
      await onMessageHandler({ data: loadPackageMessage } as MessageEvent)
    }

    expect(mockPyodide.loadPackage).toHaveBeenCalledWith('numpy')
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'PACKAGE_LOADED',
      payload: { name: 'numpy' },
    })
  })

  it('handles STOP message correctly', async () => {
    await import('../python-worker')

    const stopMessage = {
      type: 'STOP' as const,
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: stopMessage } as MessageEvent)
    }

    // Should not crash, just mark as terminated
    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ERROR' })
    )
  })

  it('handles execution error correctly', async () => {
    await import('../python-worker')

    // Initialize first
    const initMessage = {
      type: 'INIT' as const,
      payload: {
        pyodideConfig: { indexURL: 'test-url' },
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: initMessage } as MessageEvent)
    }

    const executeMessage = {
      type: 'EXECUTE' as const,
      payload: {
        executionId: 'test-exec-error',
        code: 'raise Exception("Test error")',
      },
    }

    mockPyodide.runPythonAsync.mockRejectedValue(
      new Error('Test execution error')
    )

    if (onMessageHandler) {
      await onMessageHandler({ data: executeMessage } as MessageEvent)
    }

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ERROR',
      payload: {
        executionId: 'test-exec-error',
        error: 'Test execution error',
      },
    })
  })

  it('handles package loading error correctly', async () => {
    await import('../python-worker')

    // Initialize first
    const initMessage = {
      type: 'INIT' as const,
      payload: {
        pyodideConfig: { indexURL: 'test-url' },
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: initMessage } as MessageEvent)
    }

    const loadPackageMessage = {
      type: 'LOAD_PACKAGE' as const,
      payload: { name: 'nonexistent-package' },
    }

    mockPyodide.loadPackage.mockRejectedValue(new Error('Package not found'))

    if (onMessageHandler) {
      await onMessageHandler({ data: loadPackageMessage } as MessageEvent)
    }

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ERROR',
      payload: { error: 'Package not found' },
    })
  })

  it('handles execution without initialization correctly', async () => {
    // Import worker but don't initialize
    await import('../python-worker')

    const executeMessage = {
      type: 'EXECUTE' as const,
      payload: {
        executionId: 'test-exec-no-init',
        code: 'print("Hello")',
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: executeMessage } as MessageEvent)
    }

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ERROR',
      payload: {
        executionId: 'test-exec-no-init',
        error: 'Python 环境未初始化',
      },
    })
  })

  it('handles empty or null code correctly', async () => {
    await import('../python-worker')

    // Initialize first
    const initMessage = {
      type: 'INIT' as const,
      payload: {
        pyodideConfig: { indexURL: 'test-url' },
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: initMessage } as MessageEvent)
    }

    const executeMessage = {
      type: 'EXECUTE' as const,
      payload: {
        executionId: 'test-exec-empty',
        code: '',
      },
    }

    if (onMessageHandler) {
      await onMessageHandler({ data: executeMessage } as MessageEvent)
    }

    // Should execute the default fallback code
    expect(mockPyodide.runPythonAsync).toHaveBeenCalledWith('# Python代码\n')
  })
})
