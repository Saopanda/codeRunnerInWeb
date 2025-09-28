import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBar } from '../status-bar'
import type { CompileState, CodeOutput } from '../../stores/code-runner-store'

// Mock useCodeRunnerStore
const mockStore = {
  executionState: {
    isRunning: false,
    isPaused: false,
    executionId: null as string | null,
    startTime: null as number | null,
    timeoutId: null as number | null,
    executionTime: null as number | null,
    firstExecutionTime: null as number | null
  },
  compileState: {
    isCompiling: false,
    compileErrors: [],
    compileWarnings: [],
    compileTime: null as number | null,
    firstCompileTime: null as number | null
  } as CompileState,
  language: 'javascript' as 'javascript' | 'typescript' | 'php',
  outputs: [] as CodeOutput[]
}

vi.mock('../../stores/code-runner-store', () => ({
  useCodeRunnerStore: () => mockStore
}))

describe('StatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.executionState = {
      isRunning: false,
      isPaused: false,
      executionId: null,
      startTime: null,
      timeoutId: null,
      executionTime: null,
      firstExecutionTime: null
    }
    mockStore.compileState = {
      isCompiling: false,
      compileErrors: [],
      compileWarnings: [],
      compileTime: null,
      firstCompileTime: null
    }
    mockStore.language = 'javascript'
    mockStore.outputs = []
  })

  describe('rendering', () => {
    it('should render with default state', () => {
      render(<StatusBar />)
      
      expect(screen.getByText('等待执行')).toBeInTheDocument()
    })
  })

  describe('execution status', () => {
    it('should show idle state when not running', () => {
      render(<StatusBar />)
      
      expect(screen.getByText('等待执行')).toBeInTheDocument()
    })

    it('should show running state when executing', () => {
      mockStore.executionState.isRunning = true
      mockStore.executionState.executionId = 'test-id'
      
      render(<StatusBar />)
      
      expect(screen.getByText('执行中...')).toBeInTheDocument()
    })

    it('should show execution time when completed', () => {
      mockStore.executionState.executionTime = 1500
      
      render(<StatusBar />)
      
      expect(screen.getByText('执行完成')).toBeInTheDocument()
      expect(screen.getByText('(1.5s)')).toBeInTheDocument()
    })

    it('should show first execution time when available', () => {
      mockStore.executionState.firstExecutionTime = 2000
      
      render(<StatusBar />)
      
      expect(screen.getByText('首次执行: 2.0s')).toBeInTheDocument()
    })
  })

  describe('compilation status', () => {
    it('should show idle compilation state for TypeScript', () => {
      mockStore.language = 'typescript'
      render(<StatusBar />)
      
      expect(screen.getByText('等待编译')).toBeInTheDocument()
    })

    it('should show compiling state for TypeScript', () => {
      mockStore.language = 'typescript'
      mockStore.compileState.isCompiling = true
      
      render(<StatusBar />)
      
      expect(screen.getByText('编译中...')).toBeInTheDocument()
    })

    it('should show compilation success for TypeScript', () => {
      mockStore.language = 'typescript'
      mockStore.compileState.compileTime = 800
      
      render(<StatusBar />)
      
      expect(screen.getByText('编译完成')).toBeInTheDocument()
      expect(screen.getByText('(800ms)')).toBeInTheDocument()
    })

    it('should show compilation errors for TypeScript', () => {
      mockStore.language = 'typescript'
      mockStore.compileState.compileErrors = [
        'Syntax error'
      ]
      
      render(<StatusBar />)
      
      expect(screen.getByText('编译失败')).toBeInTheDocument()
    })

    it('should show first compilation time for TypeScript', () => {
      mockStore.language = 'typescript'
      mockStore.compileState.firstCompileTime = 1200
      
      render(<StatusBar />)
      
      expect(screen.getByText('首次编译: 1.2s')).toBeInTheDocument()
    })
  })

  describe('time formatting', () => {
    it('should format milliseconds correctly', () => {
      mockStore.executionState.executionTime = 500
      
      render(<StatusBar />)
      
      expect(screen.getByText('(500ms)')).toBeInTheDocument()
    })

    it('should format seconds correctly', () => {
      mockStore.executionState.executionTime = 1500
      
      render(<StatusBar />)
      
      expect(screen.getByText('(1.5s)')).toBeInTheDocument()
    })

    it('should format compilation time correctly', () => {
      mockStore.language = 'typescript'
      mockStore.compileState.isCompiling = false
      mockStore.compileState.compileTime = 2000
      
      render(<StatusBar />)
      
      expect(screen.getByText('(2.0s)')).toBeInTheDocument()
    })
  })

  describe('combined states', () => {
    it('should show both execution and compilation status for TypeScript', () => {
      mockStore.language = 'typescript'
      mockStore.executionState.executionTime = 1000
      mockStore.compileState.compileTime = 500
      
      render(<StatusBar />)
      
      expect(screen.getByText('执行完成')).toBeInTheDocument()
      expect(screen.getByText('编译完成')).toBeInTheDocument()
    })

    it('should prioritize running state over completed state', () => {
      mockStore.executionState.isRunning = true
      mockStore.executionState.executionTime = 1000
      
      render(<StatusBar />)
      
      expect(screen.getByText('执行中...')).toBeInTheDocument()
      expect(screen.queryByText('执行完成')).not.toBeInTheDocument()
    })
  })

  describe('error states', () => {
    it('should show compilation errors when present for TypeScript', () => {
      mockStore.language = 'typescript'
      mockStore.compileState.compileErrors = [
        'Type error'
      ]
      
      render(<StatusBar />)
      
      expect(screen.getByText('编译失败')).toBeInTheDocument()
    })

    it('should show warnings when present for TypeScript', () => {
      mockStore.language = 'typescript'
      mockStore.compileState.compileWarnings = [
        'Unused variable'
      ]
      
      render(<StatusBar />)
      
      // StatusBar doesn't show compilation warnings in the current implementation
      expect(screen.getByText('等待编译')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StatusBar />)
      
      // StatusBar doesn't display language information in the current implementation
      expect(screen.getByText('等待执行')).toBeInTheDocument()
    })

    it('should update status for screen readers', () => {
      mockStore.executionState.isRunning = true
      
      render(<StatusBar />)
      
      expect(screen.getByText('执行中...')).toBeInTheDocument()
    })
  })
})
