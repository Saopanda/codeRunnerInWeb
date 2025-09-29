import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createWrapper } from '../../../../test/simple-setup'
import { useCodeRunnerStore } from '../../stores/code-runner-store'
import { EditorStatusBar } from '../editor-status-bar'

// Mock the store
const mockStore = {
  code: 'console.log("Hello World")',
  language: 'javascript' as const,
}

vi.mock('../../stores/code-runner-store')

const mockUseCodeRunnerStore = vi.mocked(useCodeRunnerStore)

describe('EditorStatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCodeRunnerStore.mockReturnValue(mockStore)
  })

  it('renders correctly with JavaScript', () => {
    render(<EditorStatusBar />, { wrapper: createWrapper() })

    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('26 字符')).toBeInTheDocument()
    expect(screen.getByText('1 行')).toBeInTheDocument()
    expect(screen.getByText('2 词')).toBeInTheDocument()
    expect(screen.getByText('编码: UTF-8')).toBeInTheDocument()
    expect(screen.getByText('缩进: 2 空格')).toBeInTheDocument()
  })

  it('displays TypeScript language correctly', () => {
    mockUseCodeRunnerStore.mockReturnValue({
      ...mockStore,
      language: 'typescript',
    })

    render(<EditorStatusBar />, { wrapper: createWrapper() })
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('displays PHP language correctly', () => {
    mockUseCodeRunnerStore.mockReturnValue({
      ...mockStore,
      language: 'php',
      code: '<?php echo "Hello World"; ?>',
    })

    render(<EditorStatusBar />, { wrapper: createWrapper() })
    expect(screen.getByText('PHP')).toBeInTheDocument()
    expect(screen.getByText('26 字符')).toBeInTheDocument()
  })

  it('calculates statistics correctly for multiline code', () => {
    const multilineCode = `function hello() {
  console.log("Hello");
  console.log("World");
}`

    mockUseCodeRunnerStore.mockReturnValue({
      ...mockStore,
      code: multilineCode,
    })

    render(<EditorStatusBar />, { wrapper: createWrapper() })

    expect(screen.getByText(`${multilineCode.length} 字符`)).toBeInTheDocument()
    expect(screen.getByText('4 行')).toBeInTheDocument()
    expect(screen.getByText('6 词')).toBeInTheDocument()
  })

  it('handles empty code correctly', () => {
    mockUseCodeRunnerStore.mockReturnValue({
      ...mockStore,
      code: '',
    })

    render(<EditorStatusBar />, { wrapper: createWrapper() })

    expect(screen.getByText('0 字符')).toBeInTheDocument()
    expect(screen.getByText('1 行')).toBeInTheDocument()
    expect(screen.getByText('0 词')).toBeInTheDocument()
  })

  it('handles whitespace-only code correctly', () => {
    mockUseCodeRunnerStore.mockReturnValue({
      ...mockStore,
      code: '   \n   \n   ',
    })

    render(<EditorStatusBar />, { wrapper: createWrapper() })

    expect(screen.getByText('9 字符')).toBeInTheDocument()
    expect(screen.getByText('3 行')).toBeInTheDocument()
    expect(screen.getByText('0 词')).toBeInTheDocument()
  })

  it('updates when code changes', () => {
    const { rerender } = render(<EditorStatusBar />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('26 字符')).toBeInTheDocument()

    // Update code
    mockUseCodeRunnerStore.mockReturnValue({
      ...mockStore,
      code: 'alert("Hi")',
    })

    rerender(<EditorStatusBar />)

    expect(screen.getByText('11 字符')).toBeInTheDocument()
    expect(screen.getByText('2 词')).toBeInTheDocument()
  })
})
