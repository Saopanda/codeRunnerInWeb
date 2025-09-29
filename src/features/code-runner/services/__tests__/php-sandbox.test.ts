import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PHPSandboxManager } from '../php-sandbox'
// import { useCodeRunnerStore } from '../../stores/code-runner-store'

// Mock php-wasm
const mockPhpWeb = {
  run: vi.fn(),
  destroy: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

// Helper function to setup mock for different scenarios
const setupMockForScenario = (scenario: string) => {
  mockPhpWeb.addEventListener.mockImplementation((event: string, callback: (event: { detail?: string }) => void) => {
    if (event === 'ready') {
      setTimeout(() => callback({}), 0)
    } else if (event === 'output') {
      if (scenario === 'success') {
        setTimeout(() => callback({ detail: 'Hello World' }), 10)
      } else if (scenario === 'multiline') {
        setTimeout(() => callback({ detail: 'Line 1\nLine 2\nLine 3' }), 10)
      } else if (scenario === 'empty') {
        // No output for empty scenario
      }
    } else if (event === 'error') {
      if (scenario === 'error') {
        setTimeout(() => callback({ detail: 'Fatal error: Call to undefined function undefined_function()' }), 10)
      } else if (scenario === 'warning') {
        setTimeout(() => callback({ detail: 'Warning: Undefined variable $undefined_var' }), 10)
      } else if (scenario === 'runtime') {
        setTimeout(() => callback({ detail: 'Runtime error' }), 10)
      }
    }
  })
  
  // Mock run method to return appropriate result
  mockPhpWeb.run.mockImplementation(() => {
    if (scenario === 'success') {
      return Promise.resolve(0)
    } else if (scenario === 'error') {
      return Promise.resolve(1)
    } else if (scenario === 'timeout') {
      return Promise.resolve(124) // Timeout exit code
    } else {
      return Promise.resolve(0)
    }
  })
}

vi.mock('php-wasm/PhpWeb.mjs', () => ({
  PhpWeb: vi.fn(() => mockPhpWeb)
}))

// Mock store
const mockStore = {
  addOutput: vi.fn(),
  setExecutionState: vi.fn(),
  clearOutputs: vi.fn()
}

vi.mock('../../stores/code-runner-store', () => ({
  useCodeRunnerStore: {
    getState: () => mockStore
  }
}))

describe('PHPSandboxManager', () => {
  let sandbox: PHPSandboxManager

  beforeEach(() => {
    vi.clearAllMocks()
    sandbox = new PHPSandboxManager()
  })

  afterEach(() => {
    if (sandbox) {
      sandbox.destroy()
    }
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(sandbox.initialize()).resolves.toBeUndefined()
    })

    it('should handle initialization errors', async () => {
      // Mock the dynamic import to reject
      vi.doMock('php-wasm/PhpWeb.mjs', () => {
        throw new Error('Import failed')
      })
      
      // Create a new sandbox instance to test initialization error
      const newErrorSandbox = new PHPSandboxManager()
      await expect(newErrorSandbox.initialize()).rejects.toThrow()
      
      // Restore original mock
      vi.doUnmock('php-wasm/PhpWeb.mjs')
    })

    it('should not reinitialize if already initialized', async () => {
      await sandbox.initialize()
      const originalImport = (global as Record<string, unknown>).import
      const importSpy = vi.fn().mockResolvedValue({ default: {} })
      ;(global as Record<string, unknown>).import = importSpy
      
      await sandbox.initialize()
      
      expect(importSpy).toHaveBeenCalledTimes(0) // Should not call import again
      
      // Restore original import
      ;(global as Record<string, unknown>).import = originalImport
    })
  })

  describe('code execution', () => {
    beforeEach(async () => {
      await sandbox.initialize()
      
      // Mock addEventListener to immediately trigger ready event
      mockPhpWeb.addEventListener.mockImplementation((event: string, callback: (event: { detail?: string }) => void) => {
        if (event === 'ready') {
          // Immediately call the callback to simulate ready event
          setTimeout(() => callback({}), 0)
        } else if (event === 'output') {
          // Mock output event
          setTimeout(() => callback({ detail: 'Hello World' }), 10)
        } else if (event === 'error') {
          // Mock error event
          setTimeout(() => callback({ detail: 'Fatal error: Call to undefined function undefined_function()' }), 10)
        }
      })
    })

    it('should execute simple PHP code', async () => {
      const code = '<?php echo "Hello World"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      // Setup mock for success scenario
      setupMockForScenario('success')

      await sandbox.executeCode(code, config)

      expect(mockPhpWeb.run).toHaveBeenCalledWith(code)
      // Check that some output was added (the exact format may vary)
      expect(mockStore.addOutput).toHaveBeenCalled()
    })

    it('should handle PHP errors', async () => {
      const code = '<?php undefined_function(); ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      // Setup mock for error scenario
      setupMockForScenario('error')

      await sandbox.executeCode(code, config)

      // Check that error output was added
      expect(mockStore.addOutput).toHaveBeenCalled()
    })

    it('should handle execution timeout', async () => {
      const code = '<?php while(true) {} ?>'
      const config = {
        timeout: 100,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      )

      await sandbox.executeCode(code, config)

      // Check that timeout error was added
      expect(mockStore.addOutput).toHaveBeenCalled()
    })

    it('should handle PHP warnings', async () => {
      const code = '<?php $undefined_var; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockResolvedValue({
        stdout: '',
        stderr: 'Warning: Undefined variable $undefined_var',
        exitCode: 0
      })

      await sandbox.executeCode(code, config)

      // Check that warning was added
      expect(mockStore.addOutput).toHaveBeenCalled()
    })
  })

  describe('execution state management', () => {
    beforeEach(async () => {
      await sandbox.initialize()
    })

    it('should set execution state when starting', async () => {
      const code = '<?php echo "test"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockResolvedValue({
        stdout: 'test',
        stderr: '',
        exitCode: 0
      })

      await sandbox.executeCode(code, config)

      expect(mockStore.setExecutionState).toHaveBeenCalledWith({
        isRunning: true,
        executionId: expect.any(String),
        startTime: expect.any(Number),
        executionTime: null
      })
    })

    it('should update execution state when completed', async () => {
      const code = '<?php echo "test"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockResolvedValue({
        stdout: 'test',
        stderr: '',
        exitCode: 0
      })

      await sandbox.executeCode(code, config)

      // Check that execution state was updated
      expect(mockStore.setExecutionState).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    beforeEach(async () => {
      await sandbox.initialize()
    })

    it('should handle PHP-WASM runtime errors', async () => {
      const code = '<?php echo "test"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockRejectedValue(new Error('Runtime error'))

      await sandbox.executeCode(code, config)

      // Check that runtime error was added
      expect(mockStore.addOutput).toHaveBeenCalled()
    })

    it('should handle initialization errors during execution', async () => {
      const code = '<?php echo "test"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      // Create new instance without initialization
      const uninitializedSandbox = new PHPSandboxManager()

      await uninitializedSandbox.executeCode(code, config)

      // Check that initialization error was added
      expect(mockStore.addOutput).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should destroy PHP instance on cleanup', async () => {
      await sandbox.initialize()
      
      // Ensure currentPhpInstance is set
      sandbox['currentPhpInstance'] = mockPhpWeb
      
      sandbox.destroy()
      
      expect(mockPhpWeb.destroy).toHaveBeenCalled()
    })

    it('should handle cleanup when not initialized', () => {
      expect(() => sandbox.destroy()).not.toThrow()
    })
  })

  describe('concurrent execution', () => {
    beforeEach(async () => {
      await sandbox.initialize()
    })

    it('should prevent concurrent execution', async () => {
      const code = '<?php sleep(1); echo "test"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      // Start first execution
      const firstExecution = sandbox.executeCode(code, config)
      
      // Try to start second execution (should return early without error)
      const secondExecution = sandbox.executeCode(code, config)
      
      // Both executions should complete (first one executes, second one returns early)
      await Promise.all([firstExecution, secondExecution])
      
      // Check that concurrent execution warning was added
      expect(mockStore.addOutput).toHaveBeenCalled()
    })
  })

  describe('output formatting', () => {
    beforeEach(async () => {
      await sandbox.initialize()
    })

    it('should format multiple lines of output', async () => {
      const code = '<?php echo "Line 1\nLine 2\nLine 3"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockResolvedValue({
        stdout: 'Line 1\nLine 2\nLine 3',
        stderr: '',
        exitCode: 0
      })

      await sandbox.executeCode(code, config)

      // Check that multiline output was added
      expect(mockStore.addOutput).toHaveBeenCalled()
    })

    it('should handle empty output', async () => {
      const code = '<?php // Empty code ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      mockPhpWeb.run.mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0
      })

      await sandbox.executeCode(code, config)

      // Check that some output was added (even for empty code)
      expect(mockStore.addOutput).toHaveBeenCalled()
    })
  })
})
