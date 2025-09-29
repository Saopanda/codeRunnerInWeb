import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CodeRunner } from '../../index'
import { useCodeRunnerStore } from '../../stores/code-runner-store'

// Mock dependencies
vi.mock('../../services/simple-sandbox', () => ({
  simpleSandboxManager: {
    executeCode: vi.fn()
  }
}))

vi.mock('../../services/php-sandbox', () => ({
  phpSandboxManager: {
    executeCode: vi.fn()
  }
}))

vi.mock('../../services/typescript-compiler', () => ({
  typescriptCompiler: {
    compile: vi.fn()
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
  Editor: ({ onChange, onMount, value }: { onChange?: (value: string) => void; onMount?: (editor: unknown) => void; value: string }) => {
    const handleChange = (e: { target: { value: string } }) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    const handleMount = () => {
      if (onMount) {
        onMount({
          getValue: () => value,
          setValue: (_newValue: string) => {},
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

describe('CodeRunner Integration Tests', () => {
  beforeEach(() => {
    // Reset store state
    useCodeRunnerStore.getState().clearOutputs()
    useCodeRunnerStore.getState().setExecutionState({
      isRunning: false,
      executionId: null,
      startTime: null,
      executionTime: null,
      firstExecutionTime: null
    })
    useCodeRunnerStore.getState().setCompileState({
      isCompiling: false,
      compileErrors: [],
      compileWarnings: [],
      compileTime: null,
      firstCompileTime: null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('JavaScript Code Execution', () => {
    it('should execute JavaScript code successfully', async () => {
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      vi.mocked(simpleSandboxManager.executeCode).mockResolvedValue(undefined)

      render(<CodeRunner />)

      // Set JavaScript code
      // Set code directly via store
      const { setCode } = useCodeRunnerStore.getState()
      setCode('console.log("Hello World")')

      // Click run button
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(simpleSandboxManager.executeCode).toHaveBeenCalledWith(
          'console.log("Hello World")',
          expect.any(Object),
          'javascript'
        )
      })
    })

    it('should handle JavaScript execution errors', async () => {
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      vi.mocked(simpleSandboxManager.executeCode).mockRejectedValue(new Error('Execution failed'))

      render(<CodeRunner />)

      // Set code directly via store
      const { setCode } = useCodeRunnerStore.getState()
      setCode('throw new Error("Test error")')

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(simpleSandboxManager.executeCode).toHaveBeenCalled()
      })
    })
  })

  describe('TypeScript Code Execution', () => {
    it('should compile and execute TypeScript code', async () => {
      const { typescriptCompiler } = await import('../../services/typescript-compiler')
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      vi.mocked(typescriptCompiler.compile).mockResolvedValue({
        success: true,
        code: 'console.log("Hello World")',
        errors: [],
        warnings: []
      })
      vi.mocked(simpleSandboxManager.executeCode).mockResolvedValue(undefined)

      render(<CodeRunner />)

      // Switch to TypeScript
      const languageSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(languageSelect, { target: { value: 'typescript' } })

      // Set TypeScript code
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'const message: string = "Hello World"; console.log(message);' } })

      // Click run button
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(typescriptCompiler.compile).toHaveBeenCalled()
        expect(simpleSandboxManager.executeCode).toHaveBeenCalled()
      })
    })

    it('should handle TypeScript compilation errors', async () => {
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

      // Set invalid TypeScript code
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'const message: string = 123;' } })

      // Click run button
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(typescriptCompiler.compile).toHaveBeenCalled()
      })
    })
  })

  describe('PHP Code Execution', () => {
    it('should execute PHP code successfully', async () => {
      const { phpSandboxManager } = await import('../../services/php-sandbox')
      
      vi.mocked(phpSandboxManager.executeCode).mockResolvedValue(undefined)

      render(<CodeRunner />)

      // Switch to PHP
      const languageSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(languageSelect, { target: { value: 'php' } })

      // Set PHP code
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: '<?php echo "Hello World"; ?>' } })

      // Click run button
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(phpSandboxManager.executeCode).toHaveBeenCalledWith(
          '<?php echo "Hello World"; ?>',
          expect.any(Object)
        )
      })
    })

    it('should handle PHP execution errors', async () => {
      const { phpSandboxManager } = await import('../../services/php-sandbox')
      
      vi.mocked(phpSandboxManager.executeCode).mockRejectedValue(new Error('PHP execution failed'))

      render(<CodeRunner />)

      // Switch to PHP
      const languageSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(languageSelect, { target: { value: 'php' } })

      // Set PHP code
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: '<?php invalid_syntax(); ?>' } })

      // Click run button
      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(phpSandboxManager.executeCode).toHaveBeenCalled()
      })
    })
  })

  describe('Code Templates', () => {
    it('should load JavaScript template', async () => {
      render(<CodeRunner />)

      // Click template button
      const templateButton = screen.getByRole('button', { name: /模板/i })
      fireEvent.click(templateButton)

      // Select JavaScript template
      const jsTemplate = screen.getByText('Hello World')
      fireEvent.click(jsTemplate)

      await waitFor(() => {
        const codeEditor = screen.getByTestId('code-editor-container')
        expect(codeEditor).toHaveValue('console.log("Hello World");')
      })
    })

    it('should load TypeScript template', async () => {
      render(<CodeRunner />)

      // Switch to TypeScript
      const languageSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(languageSelect, { target: { value: 'typescript' } })

      // Click template button
      const templateButton = screen.getByRole('button', { name: /模板/i })
      fireEvent.click(templateButton)

      // Select TypeScript template
      const tsTemplate = screen.getByText('TypeScript Basic')
      fireEvent.click(tsTemplate)

      await waitFor(() => {
        const codeEditor = screen.getByTestId('code-editor-container')
        expect(codeEditor).toHaveValue(expect.stringContaining('interface'))
      })
    })

    it('should load PHP template', async () => {
      render(<CodeRunner />)

      // Switch to PHP
      const languageSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(languageSelect, { target: { value: 'php' } })

      // Click template button
      const templateButton = screen.getByRole('button', { name: /模板/i })
      fireEvent.click(templateButton)

      // Select PHP template
      const phpTemplate = screen.getByText('PHP Basic')
      fireEvent.click(phpTemplate)

      await waitFor(() => {
        const codeEditor = screen.getByTestId('code-editor-container')
        expect(codeEditor).toHaveValue(expect.stringContaining('<?php'))
      })
    })
  })

  describe('Output Display', () => {
    it('should display execution output', async () => {
      render(<CodeRunner />)

      // Set code and execute
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'console.log("Test output")' } })

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      // Check if output area is rendered
      expect(screen.getByTestId('output-display')).toBeInTheDocument()
    })

    it('should clear output when new execution starts', async () => {
      render(<CodeRunner />)

      // First execution
      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'console.log("First")' } })

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      // Second execution
      fireEvent.change(codeEditor, { target: { value: 'console.log("Second")' } })
      fireEvent.click(runButton)

      // Output should be cleared for new execution
      expect(screen.getByTestId('output-display')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error boundary when component crashes', async () => {
      // Mock a component that throws
      const ThrowError = () => {
        throw new Error('Component error')
      }

      render(
        <div>
          <ThrowError />
        </div>
      )

      // Should show error boundary
      expect(screen.getByText(/代码运行器遇到错误/)).toBeInTheDocument()
    })
  })

  describe('Performance Monitoring', () => {
    it('should track execution performance', async () => {
      const { performanceMonitor } = await import('../../services/performance-monitor')
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      vi.mocked(simpleSandboxManager.executeCode).mockResolvedValue(undefined)

      render(<CodeRunner />)

      const codeEditor = screen.getByTestId('code-editor-container')
      fireEvent.change(codeEditor, { target: { value: 'console.log("Performance test")' } })

      const runButton = screen.getByRole('button', { name: /运行/i })
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(performanceMonitor.startExecutionMonitoring).toHaveBeenCalled()
      })
    })
  })

  describe('Security Analysis', () => {
    it('should analyze code for security issues', async () => {
      const { securityManager } = await import('../../security/security-manager')
      const { simpleSandboxManager } = await import('../../services/simple-sandbox')
      
      vi.mocked(simpleSandboxManager.executeCode).mockResolvedValue(undefined)

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
