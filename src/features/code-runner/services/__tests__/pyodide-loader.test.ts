import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPyodideConfig,
  isLocalPyodideSupported,
  checkPyodideResources,
} from '../pyodide-loader'

// Mock fetch
global.fetch = vi.fn()

describe('Pyodide Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPyodideConfig', () => {
    it('should return local config when supported', () => {
      // Mock window object
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
        },
        writable: true,
      })

      const config = getPyodideConfig()

      expect(config).toEqual({
        indexURL: '/pyodide/',
        fullStdLib: false,
        packageBaseUrl: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/',
        packages: ['numpy', 'pandas', 'matplotlib'],
      })
    })

    it('should return CDN config when local not supported', () => {
      // Mock file protocol
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'file:',
        },
        writable: true,
      })

      const config = getPyodideConfig()

      expect(config).toEqual({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/',
        fullStdLib: false,
        packages: ['numpy', 'pandas', 'matplotlib'],
      })
    })
  })

  describe('isLocalPyodideSupported', () => {
    it('should return true for http protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
        },
        writable: true,
      })

      expect(isLocalPyodideSupported()).toBe(true)
    })

    it('should return true for https protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
        },
        writable: true,
      })

      expect(isLocalPyodideSupported()).toBe(true)
    })

    it('should return false for file protocol', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'file:',
        },
        writable: true,
      })

      expect(isLocalPyodideSupported()).toBe(false)
    })
  })

  describe('checkPyodideResources', () => {
    it('should return true when resources are available', async () => {
      // Mock window object for local support
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
        },
        writable: true,
      })

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response)

      const result = await checkPyodideResources()

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith('/pyodide/pyodide.js', {
        method: 'HEAD',
      })
    })

    it('should return false when resources are not available', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
      } as Response)

      const result = await checkPyodideResources()

      expect(result).toBe(false)
    })

    it('should return false when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const result = await checkPyodideResources()

      expect(result).toBe(false)
    })
  })
})
