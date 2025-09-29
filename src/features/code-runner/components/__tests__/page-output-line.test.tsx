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

  it('renders error output with correct styling', () => {
    const output = createMockOutput({
      type: 'error',
      message: 'Error occurred',
    })
    const { container } = render(<PageOutputLine output={output} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Error occurred')).toBeInTheDocument()

    // 检查错误样式的容器
    const outputContainer = container.firstChild
    expect(outputContainer).toHaveClass(
      'bg-red-50',
      'dark:bg-red-950/20',
      'border-red-200',
      'dark:border-red-800'
    )

    // 检查错误文本颜色
    expect(screen.getByText('Error occurred')).toHaveClass(
      'text-red-700',
      'dark:text-red-300'
    )
  })

  it('renders warning output with correct styling', () => {
    const output = createMockOutput({
      type: 'warn',
      message: 'Warning message',
    })
    const { container } = render(<PageOutputLine output={output} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Warning message')).toBeInTheDocument()

    const outputContainer = container.firstChild
    expect(outputContainer).toHaveClass(
      'bg-yellow-50',
      'dark:bg-yellow-950/20',
      'border-yellow-200',
      'dark:border-yellow-800'
    )
    expect(screen.getByText('Warning message')).toHaveClass(
      'text-yellow-700',
      'dark:text-yellow-300'
    )
  })

  it('renders info output with correct styling', () => {
    const output = createMockOutput({ type: 'info', message: 'Info message' })
    const { container } = render(<PageOutputLine output={output} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Info message')).toBeInTheDocument()

    const outputContainer = container.firstChild
    expect(outputContainer).toHaveClass(
      'bg-blue-50',
      'dark:bg-blue-950/20',
      'border-blue-200',
      'dark:border-blue-800'
    )
    expect(screen.getByText('Info message')).toHaveClass(
      'text-blue-700',
      'dark:text-blue-300'
    )
  })

  it('renders system message with special styling', () => {
    const output = createMockOutput({
      source: 'system',
      message: 'System initialized',
    })
    const { container } = render(<PageOutputLine output={output} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('System initialized')).toBeInTheDocument()

    const outputContainer = container.firstChild
    expect(outputContainer).toHaveClass(
      'bg-purple-50',
      'dark:bg-purple-950/20',
      'border-purple-200',
      'dark:border-purple-800'
    )
    expect(screen.getByText('System initialized')).toHaveClass(
      'text-purple-700',
      'dark:text-purple-300'
    )
  })

  it('renders log output with default styling', () => {
    const output = createMockOutput({ type: 'log', message: 'Log message' })
    const { container } = render(<PageOutputLine output={output} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Log message')).toBeInTheDocument()

    const outputContainer = container.firstChild
    expect(outputContainer).toHaveClass(
      'bg-green-50',
      'dark:bg-green-950/20',
      'border-green-200',
      'dark:border-green-800'
    )
    expect(screen.getByText('Log message')).toHaveClass(
      'text-green-700',
      'dark:text-green-300'
    )
  })

  it('hides timestamp when showTimestamp is false', () => {
    const output = createMockOutput()
    render(<PageOutputLine output={output} showTimestamp={false} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.queryByText('08:00:00')).not.toBeInTheDocument()
  })

  it('shows correct icons for different output types', () => {
    const errorOutput = createMockOutput({ type: 'error' })
    const { container: errorContainer } = render(
      <PageOutputLine output={errorOutput} />,
      { wrapper: createWrapper() }
    )

    // 错误输出应该有 XCircle 图标
    expect(errorContainer.querySelector('.lucide-x-circle')).toBeInTheDocument()

    const warnOutput = createMockOutput({ type: 'warn' })
    const { container: warnContainer } = render(
      <PageOutputLine output={warnOutput} />,
      { wrapper: createWrapper() }
    )

    // 警告输出应该有 AlertTriangle 图标
    expect(
      warnContainer.querySelector('.lucide-alert-triangle')
    ).toBeInTheDocument()

    const infoOutput = createMockOutput({ type: 'info' })
    const { container: infoContainer } = render(
      <PageOutputLine output={infoOutput} />,
      { wrapper: createWrapper() }
    )

    // 信息输出应该有 Info 图标
    expect(infoContainer.querySelector('.lucide-info')).toBeInTheDocument()

    const systemOutput = createMockOutput({ source: 'system' })
    const { container: systemContainer } = render(
      <PageOutputLine output={systemOutput} />,
      { wrapper: createWrapper() }
    )

    // 系统消息应该有 Settings 图标
    expect(
      systemContainer.querySelector('.lucide-settings')
    ).toBeInTheDocument()

    const logOutput = createMockOutput({ type: 'log' })
    const { container: logContainer } = render(
      <PageOutputLine output={logOutput} />,
      { wrapper: createWrapper() }
    )

    // 普通日志应该有 Terminal 图标
    expect(logContainer.querySelector('.lucide-terminal')).toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    const output = createMockOutput({
      timestamp: new Date('2023-05-15T14:30:45').getTime(),
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    // 时间戳应该显示为本地时间格式
    expect(screen.getByText(/\d{2}:\d{2}:\d{2}/)).toBeInTheDocument()
  })

  it('preserves whitespace and formatting in message', () => {
    const output = createMockOutput({
      message: 'Line 1\nLine 2\n  Indented line',
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    const messageElement = screen.getByText('Line 1\nLine 2\n  Indented line')
    expect(messageElement).toHaveClass('whitespace-pre-wrap')
  })

  it('handles HTML content safely', () => {
    const output = createMockOutput({
      message: '<script>alert("xss")</script>Hello World',
    })
    render(<PageOutputLine output={output} />, { wrapper: createWrapper() })

    // HTML 应该作为文本显示，而不是被执行
    expect(
      screen.getByText('<script>alert("xss")</script>Hello World')
    ).toBeInTheDocument()
  })

  it('applies correct card styling structure', () => {
    const output = createMockOutput()
    const { container } = render(<PageOutputLine output={output} />, {
      wrapper: createWrapper(),
    })

    const card = container.firstChild
    expect(card).toHaveClass('rounded-lg', 'border', 'p-3', 'mb-2')
  })
})
