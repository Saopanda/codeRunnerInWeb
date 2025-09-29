// import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCodeRunnerStore } from '../../stores/code-runner-store'
import { CodeEditor } from '../code-editor'

// Mock the store
vi.mock('../../stores/code-runner-store', () => ({
  useCodeRunnerStore: vi.fn(),
}))

// Mock the theme provider
vi.mock('@/context/theme-provider', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
  }),
}))

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({
    onChange,
    onMount,
    value,
  }: {
    onChange?: (value: string) => void
    onMount?: (editor: unknown) => void
    value: string
  }) => {
    const handleChange = (e: { target: { value: string } }) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    const handleMount = () => {
      if (onMount) {
        onMount({
          getValue: () => value,
          setValue: (_newValue: string) => {
            // Mock setValue
          },
          focus: () => {},
          dispose: () => {},
          updateOptions: (_options: unknown) => {
            // Mock updateOptions
          },
        })
      }
    }

    // Call onMount immediately when component mounts
    setTimeout(() => {
      handleMount()
    }, 0)

    return (
      <div data-testid='monaco-editor'>
        <textarea
          data-testid='editor-textarea'
          value={value}
          onChange={handleChange}
          placeholder='Enter code here...'
        />
      </div>
    )
  },
  Editor: ({
    onChange,
    onMount,
    value,
  }: {
    onChange?: (value: string) => void
    onMount?: (editor: unknown) => void
    value: string
  }) => {
    const handleChange = (e: { target: { value: string } }) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    const handleMount = () => {
      if (onMount) {
        onMount({
          getValue: () => value,
          setValue: (_newValue: string) => {
            // Mock setValue
          },
          focus: () => {},
          dispose: () => {},
          updateOptions: (_options: unknown) => {
            // Mock updateOptions
          },
        })
      }
    }

    // Call onMount immediately when component mounts
    setTimeout(() => {
      handleMount()
    }, 0)

    return (
      <div data-testid='monaco-editor'>
        <textarea
          data-testid='editor-textarea'
          value={value}
          onChange={handleChange}
          placeholder='Enter code here...'
        />
      </div>
    )
  },
}))

describe('CodeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    const mockStore = {
      code: 'console.log("Hello World");',
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('should display initial code value', () => {
    const code = 'console.log("Hello World");'
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })

  it('should handle code changes', async () => {
    const mockSetCode = vi.fn()
    const mockStore = {
      code: 'console.log("Hello World");',
      setCode: mockSetCode,
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    const textarea = screen.getByTestId('editor-textarea')
    fireEvent.change(textarea, { target: { value: 'console.log("Updated");' } })

    expect(mockSetCode).toHaveBeenCalledWith('console.log("Updated");')
  })

  it('should handle editor mount', async () => {
    const mockStore = {
      code: 'console.log("Hello World");',
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })
  })

  it('should handle different languages', () => {
    const mockStore = {
      code: 'const x = 1;',
      setCode: vi.fn(),
      language: 'typescript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('should handle PHP code', () => {
    const mockStore = {
      code: '<?php echo "Hello World"; ?>',
      setCode: vi.fn(),
      language: 'php' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('should handle empty code', () => {
    const mockStore = {
      code: '',
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue('')
  })

  it('should handle code with special characters', () => {
    const code = 'console.log("Hello \\"World\\"");'
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })

  it('should handle multiline code', () => {
    const code = `function hello() {
  console.log("Hello World");
  return "done";
}`
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })

  it('should handle TypeScript code', () => {
    const code = 'interface User { name: string; age: number; }'
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'typescript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })

  it('should handle PHP code with variables', () => {
    const code = '<?php $name = "John"; echo "Hello " . $name; ?>'
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'php' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })

  it('should handle code with comments', () => {
    const code = `// This is a comment
console.log("Hello World"); // Another comment`
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })

  it('should handle code with errors', () => {
    const code = 'console.log("Hello World" // Missing closing parenthesis'
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })

  it('should handle very long code', () => {
    const code = 'console.log("Hello World");'.repeat(100)
    const mockStore = {
      code,
      setCode: vi.fn(),
      language: 'javascript' as const,
    }
    vi.mocked(useCodeRunnerStore).mockReturnValue(
      mockStore as unknown as ReturnType<typeof useCodeRunnerStore>
    )

    render(<CodeEditor />)

    expect(screen.getByTestId('editor-textarea')).toHaveValue(code)
  })
})
