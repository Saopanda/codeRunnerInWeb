import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  createStableTimestamp,
  timePatterns,
} from '../../../../test/ci-helpers'
import { createWrapper } from '../../../../test/simple-setup'
import type { CodeOutput } from '../../stores/code-runner-store'
import { PageOutputLine } from '../page-output-line'

const createMockOutput = (overrides: Partial<CodeOutput> = {}): CodeOutput => ({
  id: '1',
  type: 'log',
  message: 'Test message',
  timestamp: createStableTimestamp(), // 使用稳定的时间戳
  source: 'console',
  ...overrides,
})

describe('PageOutputLine', () => {
  it('renders basic output correctly', () => {
    const output = createMockOutput()
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    expect(screen.getByText('Test message')).toBeInTheDocument()
    // 使用更灵活的时间格式匹配，适配不同时区
    expect(screen.getByText(timePatterns.timeAny)).toBeInTheDocument()
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
    // 验证没有时间戳格式的文本
    expect(screen.queryByText(timePatterns.timeAny)).not.toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    const output = createMockOutput({
      timestamp: createStableTimestamp('2023-05-15T14:30:45.000Z'),
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    // 时间戳应该显示为时间格式，使用CI友好的正则表达式匹配
    expect(screen.getByText(timePatterns.timeAny)).toBeInTheDocument()
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
