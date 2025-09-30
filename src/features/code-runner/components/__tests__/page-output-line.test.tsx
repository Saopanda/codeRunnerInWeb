import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createWrapper } from '../../../../test/simple-setup'
import type { CodeOutput } from '../../stores/code-runner-store'
import { PageOutputLine } from '../page-output-line'

const createMockOutput = (overrides: Partial<CodeOutput> = {}): CodeOutput => ({
  id: '1',
  type: 'log',
  message: 'Test message',
  timestamp: 1640995200000, // 2022-01-01 00:00:00
  source: 'console',
  ...overrides,
})

describe('PageOutputLine', () => {
  it('renders basic output correctly', () => {
    const output = createMockOutput()
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.getByText('08:00:00')).toBeInTheDocument()
  })

  it('renders error output with message', () => {
    const output = createMockOutput({
      type: 'error',
      message: 'Error occurred',
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  it('renders warning output with message', () => {
    const output = createMockOutput({
      type: 'warn',
      message: 'Warning message',
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })

  it('renders info output with message', () => {
    const output = createMockOutput({
      type: 'info',
      message: 'Info message',
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Info message')).toBeInTheDocument()
  })

  it('hides timestamp when showTimestamp is false', () => {
    const output = createMockOutput()
    render(<PageOutputLine output={output} showTimestamp={false} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.queryByText('08:00:00')).not.toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    const output = createMockOutput({
      timestamp: new Date('2023-05-15T14:30:45').getTime(),
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    // 时间戳应该显示为本地时间格式
    expect(screen.getByText(/\d{2}:\d{2}:\d{2}/)).toBeInTheDocument()
  })

  it('handles HTML content safely', () => {
    const output = createMockOutput({
      message: '<script>alert("xss")</script>Safe content',
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    // 脚本标签应该被过滤掉，只显示安全内容
    expect(
      screen.getByText(/<script>alert\("xss"\)<\/script>Safe content/)
    ).toBeInTheDocument()
  })
})
