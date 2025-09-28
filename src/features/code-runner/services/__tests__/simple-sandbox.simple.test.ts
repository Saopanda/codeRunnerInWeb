import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SimpleSandboxManager } from '../simple-sandbox'
// import { useCodeRunnerStore } from '../../stores/code-runner-store'
import { typescriptCompiler } from '../typescript-compiler'
import { performanceMonitor } from '../performance-monitor'
import { phpSandboxManager } from '../php-sandbox'

// Mock dependencies
vi.mock('../typescript-compiler')
vi.mock('../performance-monitor')
vi.mock('../php-sandbox')

// Mock store
const mockStore = {
  setExecutionState: vi.fn(),
  clearOutputs: vi.fn(),
  addOutput: vi.fn(),
  setCompileState: vi.fn()
}

vi.mock('../../stores/code-runner-store', () => ({
  useCodeRunnerStore: {
    getState: () => mockStore
  }
}))

describe('SimpleSandboxManager', () => {
  let sandbox: SimpleSandboxManager

  beforeEach(() => {
    vi.clearAllMocks()
    sandbox = new SimpleSandboxManager()
  })

  afterEach(() => {
    if (sandbox) {
      sandbox.destroy()
    }
  })

  describe('basic functionality', () => {
    it('should create instance', () => {
      expect(sandbox).toBeInstanceOf(SimpleSandboxManager)
    })

    it('should destroy without errors', () => {
      expect(() => sandbox.destroy()).not.toThrow()
    })
  })

  describe('JavaScript execution', () => {
    it('should execute JavaScript code', async () => {
      const code = 'console.log("Hello World");'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      vi.mocked(performanceMonitor.startExecutionMonitoring).mockReturnValue(() => 100)

      await sandbox.executeCode(code, config, 'javascript')

      expect(performanceMonitor.startExecutionMonitoring).toHaveBeenCalledWith(code, 'javascript')
      expect(mockStore.setExecutionState).toHaveBeenCalledWith({
        isRunning: true,
        executionId: expect.any(String),
        startTime: expect.any(Number),
        executionTime: null
      })
    })
  })

  describe('TypeScript execution', () => {
    it('should compile and execute TypeScript code', async () => {
      const code = 'const message: string = "Hello TypeScript"; console.log(message);'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      vi.mocked(typescriptCompiler.compile).mockResolvedValue({
        success: true,
        code: 'const message = "Hello TypeScript"; console.log(message);',
        errors: [],
        warnings: [],
      })

      vi.mocked(performanceMonitor.startExecutionMonitoring).mockReturnValue(() => 100)

      await sandbox.executeCode(code, config, 'typescript')

      expect(typescriptCompiler.compile).toHaveBeenCalledWith(code, expect.any(Object))
    })
  })

  describe('PHP execution', () => {
    it('should execute PHP code using PHP sandbox', async () => {
      const code = '<?php echo "Hello PHP"; ?>'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      vi.mocked(phpSandboxManager.executeCode).mockResolvedValue(undefined)
      vi.mocked(performanceMonitor.startExecutionMonitoring).mockReturnValue(() => 100)

      await sandbox.executeCode(code, config, 'php')

      expect(phpSandboxManager.executeCode).toHaveBeenCalledWith(code, config)
    })
  })

  describe('concurrent execution', () => {
    it('should prevent concurrent execution', async () => {
      const code = 'console.log("test");'
      const config = {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: []
      }

      vi.mocked(performanceMonitor.startExecutionMonitoring).mockReturnValue(() => 100)

      // Manually set executionId to simulate running execution
      sandbox['executionId'] = 'test-execution-id'
      
      // Try to start execution (should fail)
      await expect(sandbox.executeCode(code, config, 'javascript')).rejects.toThrow('已有代码正在执行中')
      
      // Clean up
      sandbox['executionId'] = null
    })
  })
})
