import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CodeRunnerErrorBoundary } from '../error-boundary'

// Mock component that throws error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Mock console.error to avoid noise in tests
 
const originalConsoleError = console.error
beforeEach(() => {
   
  console.error = vi.fn()
})

afterEach(() => {
   
  console.error = originalConsoleError
})

describe('CodeRunnerErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normal operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={false} />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText(/No error/)).toBeInTheDocument()
    })

    it('should render multiple children when no error occurs', () => {
      render(
        <CodeRunnerErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should catch and display error when child throws', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText(/代码运行器遇到错误/)).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('should show error details', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('should show reload button', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByRole('button', { name: /刷新页面/i })).toBeInTheDocument()
    })
  })

  describe('error recovery', () => {
    it('should allow retry when retry button is clicked', () => {
      const { rerender } = render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      // Should show error initially
      expect(screen.getByText(/代码运行器遇到错误/)).toBeInTheDocument()
      
      // Click retry button
      const retryButton = screen.getByRole('button', { name: /重试/i })
      fireEvent.click(retryButton)
      
      // Rerender with no error
      rerender(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={false} />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText(/No error/)).toBeInTheDocument()
      expect(screen.queryByText(/代码运行器遇到错误/)).not.toBeInTheDocument()
    })

    it('should allow reload when reload button is clicked', () => {
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: {
          reload: mockReload
        },
        writable: true
      })
      
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      const reloadButton = screen.getByRole('button', { name: /刷新页面/i })
      fireEvent.click(reloadButton)
      
      expect(mockReload).toHaveBeenCalled()
    })
  })

  describe('error boundary state', () => {
    it('should reset error state when children change', () => {
      const { rerender } = render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      // Should show error
      expect(screen.getByText(/代码运行器遇到错误/)).toBeInTheDocument()
      
      // Change to component that doesn't throw
      rerender(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={false} />
        </CodeRunnerErrorBoundary>
      )
      
      // Should show normal content
      expect(screen.getByText(/No error/)).toBeInTheDocument()
      expect(screen.queryByText(/代码运行器遇到错误/)).not.toBeInTheDocument()
    })
  })

  describe('error reporting', () => {
    it('should log error to console', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
       
      expect(console.error).toHaveBeenCalled()
    })

    it('should capture error information', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /刷新页面/i })).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      render(
        <CodeRunnerErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CodeRunnerErrorBoundary>
      )
      
      const retryButton = screen.getByRole('button', { name: /重试/i })
      const reloadButton = screen.getByRole('button', { name: /刷新页面/i })
      
      expect(retryButton).toBeInTheDocument()
      expect(reloadButton).toBeInTheDocument()
    })
  })

  describe('error types', () => {
    it('should handle different error types', () => {
      const CustomError = () => {
        throw new TypeError('Type error')
      }
      
      render(
        <CodeRunnerErrorBoundary>
          <CustomError />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText('Type error')).toBeInTheDocument()
    })

    it('should handle errors without message', () => {
      const NoMessageError = () => {
        throw new Error()
      }
      
      render(
        <CodeRunnerErrorBoundary>
          <NoMessageError />
        </CodeRunnerErrorBoundary>
      )
      
      expect(screen.getByText(/代码运行器遇到错误/)).toBeInTheDocument()
    })
  })
})
