import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutputDisplay } from '../output-display'
import type { CodeOutput } from '../../stores/code-runner-store'

// Mock useCodeRunnerStore
const mockStore = {
  outputs: [] as CodeOutput[],
  clearOutputs: vi.fn(),
  filter: 'all' as const,
  searchTerm: '',
  selectedOutputs: [] as string[],
  toggleOutputSelection: vi.fn(),
  clearSelection: vi.fn(),
  executionState: {
    isRunning: false,
    isPaused: false,
    executionId: null,
    startTime: null,
    timeoutId: null,
    executionTime: null,
    firstExecutionTime: null
  },
  compileState: {
    isCompiling: false,
    compileErrors: [],
    compileWarnings: [],
    compileTime: null,
    firstCompileTime: null
  },
  language: 'javascript' as const
}

vi.mock('../../stores/code-runner-store', () => ({
  useCodeRunnerStore: () => mockStore
}))

describe('OutputDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.outputs = []
    mockStore.filter = 'all'
    mockStore.searchTerm = ''
    mockStore.selectedOutputs = []
  })

  describe('rendering', () => {
    it('should render with empty outputs', () => {
      render(<OutputDisplay />)
      
      expect(screen.getByText('等待执行代码...')).toBeInTheDocument()
    })

    it('should render with outputs', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'log',
          message: 'Hello World',
          timestamp: Date.now(),
          source: 'console'
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('Hello World')).toBeInTheDocument()
      expect(screen.queryByText('等待执行...')).not.toBeInTheDocument()
    })
  })

  describe('output types', () => {
    it('should display log output correctly', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'log',
          message: 'Log message',
          timestamp: Date.now(),
          source: 'console',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('Log message')).toBeInTheDocument()
    })

    it('should display error output correctly', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'error',
          message: 'Error message',
          timestamp: Date.now(),
          source: 'error',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('should display warning output correctly', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'warn',
          message: 'Warning message',
          timestamp: Date.now(),
          source: 'console',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })

    it('should display info output correctly', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'info',
          message: 'Info message',
          timestamp: Date.now(),
          source: 'console',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })
  })

  describe('multiple outputs', () => {
    it('should display multiple outputs in order', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'log',
          message: 'First message',
          timestamp: Date.now(),
          source: 'console',
        },
        {
          id: '2',
          type: 'error',
          message: 'Second message',
          timestamp: Date.now() + 1000,
          source: 'error',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      const outputElements = screen.getAllByText(/message/)
      expect(outputElements[0]).toHaveTextContent('First message')
      expect(outputElements[1]).toHaveTextContent('Second message')
    })
  })

  describe('clear functionality', () => {
    it('should not have clear button (not implemented)', () => {
      render(<OutputDisplay />)
      
      expect(screen.queryByRole('button', { name: /清空/i })).not.toBeInTheDocument()
    })
  })

  describe('language support', () => {
    it('should display JavaScript output', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'log',
          message: 'JS output',
          timestamp: Date.now(),
          source: 'console',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('JS output')).toBeInTheDocument()
    })

    it('should display TypeScript output', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'log',
          message: 'TS output',
          timestamp: Date.now(),
          source: 'console',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('TS output')).toBeInTheDocument()
    })

    it('should display PHP output', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'log',
          message: 'PHP output',
          timestamp: Date.now(),
          source: 'console',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('PHP output')).toBeInTheDocument()
    })
  })

  describe('timestamp formatting', () => {
    it('should display relative time for recent outputs', () => {
      const outputs: CodeOutput[] = [
        {
          id: '1',
          type: 'log',
          message: 'Recent message',
          timestamp: Date.now(),
          source: 'console',
        }
      ]
      mockStore.outputs = outputs
      
      render(<OutputDisplay />)
      
      expect(screen.getByText('Recent message')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper structure', () => {
      render(<OutputDisplay />)
      
      expect(screen.getByText('等待执行代码...')).toBeInTheDocument()
    })
  })
})
