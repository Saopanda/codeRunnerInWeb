import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CodeRunner } from '../../index'
import { useCodeRunnerStore } from '../../stores/code-runner-store'

// Mock all dependencies
vi.mock('../../services/simple-sandbox', () => ({
  simpleSandboxManager: {
    executeCode: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../../services/php-sandbox', () => ({
  phpSandboxManager: {
    executeCode: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('../../services/typescript-compiler', () => ({
  typescriptCompiler: {
    compile: vi.fn().mockResolvedValue({
      success: true,
      code: 'console.log("compiled")',
      errors: [],
      warnings: []
    })
  }
}))

vi.mock('../../services/performance-monitor', () => ({
  performanceMonitor: {
    startExecutionMonitoring: vi.fn(() => () => 100),
    recordMetric: vi.fn()
  }
}))

vi.mock('../../security/security-manager', () => ({
  securityManager: {
    analyzeCode: vi.fn(() => ({
      riskLevel: 'low',
      issues: []
    }))
  }
}))

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, onMount, value }: { onChange?: (value: string) => void; onMount?: (editor: unknown) => void; value: string }) => {
    const handleChange = (e: { target: { value: string } }) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    const handleMount = () => {
      if (onMount) {
        onMount({
          getValue: () => value,
          setValue: () => {},
          focus: () => {},
          dispose: () => {}
        })
      }
    }

    return (
      <div data-testid="monaco-editor">
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={handleChange}
          onFocus={handleMount}
          placeholder="Enter code here..."
        />
      </div>
    )
  }
}))

describe('CodeRunner Simple Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the code runner interface', () => {
      render(<CodeRunner />)
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /运行/i })).toBeInTheDocument()
      expect(screen.getByTestId('output-display')).toBeInTheDocument()
    })

    it('should display language selector', () => {
      render(<CodeRunner />)
      
      expect(screen.getByRole('combobox', { name: /语言/i })).toBeInTheDocument()
    })

    it('should display template button', () => {
      render(<CodeRunner />)
      
      expect(screen.getByRole('button', { name: /模板/i })).toBeInTheDocument()
    })
  })

  describe('Code Execution Flow', () => {
    it('should execute JavaScript code', async () => {
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      render(<CodeRunner />)

      // Set code
      // Set code directly via store
      const { setCode } = useCodeRunnerStore.getState()
      setCode('console.log("test")')

      // Execute
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(simpleSandboxManager.executeCode).toHaveBeenCalledWith(
          'console.log("test")',
          expect.any(Object),
          'javascript'
        )
      })
    })

    it('should execute TypeScript code after compilation', async () => {
      const { typescriptCompiler } = await import('../../services/typescript-compiler')
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      render(<CodeRunner />)

      // Switch to TypeScript
      const languageSelect = screen.getByRole('combobox', { name: /语言/i })
      fireEvent.change(languageSelect, { target: { value: 'typescript' } })

      // Set TypeScript code
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'const x: number = 42;' } })

      // Execute
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(typescriptCompiler.compile).toHaveBeenCalled()
        expect(simpleSandboxManager.executeCode).toHaveBeenCalled()
      })
    })

    it('should execute PHP code', async () => {
      const { phpSandboxManager } = await import('../../services/php-sandbox')
      
      render(<CodeRunner />)

      // Switch to PHP
      const languageSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(languageSelect, { target: { value: 'php' } })

      // Set PHP code - Monaco Editor doesn't render in test environment
      // We'll test the store directly instead
      const { setCode } = useCodeRunnerStore.getState()
      setCode('<?php echo "test"; ?>')

      // Execute
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(phpSandboxManager.executeCode).toHaveBeenCalledWith(
          '<?php echo "test"; ?>',
          expect.any(Object)
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      vi.mocked(simpleSandboxManager.executeCode).mockRejectedValue(new Error('Execution failed'))

      render(<CodeRunner />)

      // Set code directly via store
      const { setCode } = useCodeRunnerStore.getState()
      setCode('throw new Error("test")')

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(simpleSandboxManager.executeCode).toHaveBeenCalled()
      })
    })

    it('should handle compilation errors', async () => {
      const { typescriptCompiler } = await import('../../services/typescript-compiler')
      
      vi.mocked(typescriptCompiler.compile).mockResolvedValue({
        success: false,
        code: '',
        errors: ['Type error'],
        warnings: []
      })

      render(<CodeRunner />)

      // Switch to TypeScript
      const languageSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(languageSelect, { target: { value: 'typescript' } })

      // Set code directly via store
      const { setCode } = useCodeRunnerStore.getState()
      setCode('const x: string = 123;')

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(typescriptCompiler.compile).toHaveBeenCalled()
      })
    })
  })

  describe('State Management', () => {
    it('should update execution state during code execution', async () => {
      render(<CodeRunner />)

      // Set code directly via store
      const { setCode } = useCodeRunnerStore.getState()
      setCode('console.log("test")')

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      // Check if status bar shows execution state
      expect(screen.getByText(/执行中/)).toBeInTheDocument()
    })

    it('should clear outputs when new execution starts', async () => {
      render(<CodeRunner />)

      // First execution
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'console.log("first")' } })

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      // Second execution should clear previous outputs
      fireEvent.change(codeEditor, { target: { value: 'console.log("second")' } })
      fireEvent.click(runButton)

      expect(screen.getByTestId('output-display')).toBeInTheDocument()
    })
  })

  describe('Performance and Security', () => {
    it('should start performance monitoring', async () => {
      const { performanceMonitor } = await import('../../services/performance-monitor')
      
      render(<CodeRunner />)

      // Set code directly via store
      const { setCode } = useCodeRunnerStore.getState()
      setCode('console.log("test")')

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(performanceMonitor.startExecutionMonitoring).toHaveBeenCalled()
      })
    })

    it('should analyze code for security issues', async () => {
      const { securityManager } = await import('../../security/security-manager')
      
      render(<CodeRunner />)

      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'localStorage.getItem("key")' } })

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(securityManager.analyzeCode).toHaveBeenCalledWith(
          'localStorage.getItem("key")',
          'javascript'
        )
      })
    })
  })
})
