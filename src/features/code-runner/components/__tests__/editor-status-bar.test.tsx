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
    const phpCode = '<?php echo "Hello World"; ?>'
    mockUseCodeRunnerStore.mockReturnValue({
      ...mockStore,
      language: 'php',
      code: phpCode,
    })

    render(<EditorStatusBar />, { wrapper: createWrapper() })
    expect(screen.getByText('PHP')).toBeInTheDocument()
  })
})
