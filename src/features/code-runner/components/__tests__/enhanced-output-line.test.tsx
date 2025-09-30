import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  createStableTimestamp,
  timePatterns,
} from '../../../../test/ci-helpers'
import { createWrapper } from '../../../../test/simple-setup'
import type { CodeOutput } from '../../stores/code-runner-store'
import { EnhancedOutputLine } from '../enhanced-output-line'

const createMockOutput = (overrides: Partial<CodeOutput> = {}): CodeOutput => ({
  id: '1',
  type: 'log',
  message: 'Test message',
  timestamp: createStableTimestamp(), // 使用稳定的时间戳
  source: 'console',
  ...overrides,
})

describe('EnhancedOutputLine', () => {
  it('renders basic output correctly', () => {
    const output = createMockOutput()
    render(<EnhancedOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.getByText(timePatterns.timeAny)).toBeInTheDocument()
    expect(screen.getByText('[console]')).toBeInTheDocument()
  })

  it('renders error output with correct icon and styling', () => {
    const output = createMockOutput({
      type: 'error',
      message: 'Error occurred',
    })
    render(<EnhancedOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    // 错误类型的文本会有红色样式
    expect(screen.getByText('Error occurred')).toHaveClass(
      'text-red-600',
      'dark:text-red-400'
    )
  })

  it('renders warning output with correct icon and styling', () => {
    const output = createMockOutput({
      type: 'warn',
      message: 'Warning message',
    })
    render(<EnhancedOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Warning message')).toBeInTheDocument()
    expect(screen.getByText('Warning message')).toHaveClass(
      'text-yellow-600',
      'dark:text-yellow-400'
    )
  })

  it('renders info output with correct icon and styling', () => {
    const output = createMockOutput({ type: 'info', message: 'Info message' })
    render(<EnhancedOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Info message')).toBeInTheDocument()
    expect(screen.getByText('Info message')).toHaveClass(
      'text-blue-600',
      'dark:text-blue-400'
    )
  })

  it('renders system message with special styling', () => {
    const output = createMockOutput({
      source: 'system',
      message: 'System initialized',
    })
    render(<EnhancedOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('System initialized')).toBeInTheDocument()
    expect(screen.getByText('[系统]')).toBeInTheDocument()
    expect(screen.getByText('System initialized')).toHaveClass(
      'text-purple-600',
      'dark:text-purple-400'
    )
  })

  it('hides timestamp when showTimestamp is false', () => {
    const output = createMockOutput()
    render(<EnhancedOutputLine output={output} showTimestamp={false} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.queryByText('08:00:00')).not.toBeInTheDocument()
  })

  it('shows checkbox when showCheckbox is true', () => {
    const output = createMockOutput()
    const onToggleSelect = vi.fn()
    render(
      <EnhancedOutputLine
        output={output}
        showCheckbox={true}
        onToggleSelect={onToggleSelect}
      />,
      { wrapper: createWrapper() }
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('handles checkbox selection correctly', async () => {
    const user = userEvent.setup()
    const output = createMockOutput()
    const onToggleSelect = vi.fn()
    render(
      <EnhancedOutputLine
        output={output}
        showCheckbox={true}
        onToggleSelect={onToggleSelect}
        isSelected={false}
      />,
      { wrapper: createWrapper() }
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(onToggleSelect).toHaveBeenCalledWith('1')
  })

  it('shows selected state correctly', () => {
    const output = createMockOutput()
    const onToggleSelect = vi.fn()
    render(
      <EnhancedOutputLine
        output={output}
        showCheckbox={true}
        onToggleSelect={onToggleSelect}
        isSelected={true}
      />,
      { wrapper: createWrapper() }
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('formats timestamp correctly', () => {
    const output = createMockOutput({
      timestamp: new Date('2023-05-15T14:30:45').getTime(),
    })
    render(<EnhancedOutputLine output={output} />, { wrapper: createWrapper() })

    // 时间戳应该显示为本地时间格式
    expect(screen.getByText(/\d{2}:\d{2}:\d{2}/)).toBeInTheDocument()
  })
})
