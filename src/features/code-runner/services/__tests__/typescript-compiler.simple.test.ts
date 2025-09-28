import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as esbuild from 'esbuild-wasm'
import type { BuildResult } from 'esbuild-wasm'
import { typescriptCompiler } from '../typescript-compiler'

// Mock esbuild-wasm
vi.mock('esbuild-wasm', () => ({
  initialize: vi.fn(),
  build: vi.fn(),
  transform: vi.fn(),
}))

describe('TypeScriptCompiler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('compile', () => {
    it('should successfully compile TypeScript code', async () => {
      const mockCode = 'const message: string = "Hello World";'
      const mockResult = {
        outputFiles: [{ text: 'var message = "Hello World";' }],
        errors: [],
        warnings: [],
      }

      vi.mocked(esbuild.build).mockResolvedValue(mockResult as unknown as BuildResult)

      const result = await typescriptCompiler.compile(mockCode, {
        target: 'es2020',
        format: 'iife',
        minify: false,
      })

      expect(result.success).toBe(true)
      expect(result.code).toBe('var message = "Hello World";')
      expect(result.errors).toBeUndefined()
    })

    it('should handle compilation errors', async () => {
      const mockCode = 'const message: string = "Hello World"'
      const mockResult = {
        outputFiles: [],
        errors: [
          {
            text: 'Expected ";" but found end of file',
            location: { file: 'input.ts', line: 1, column: 30 },
          },
        ],
        warnings: [],
      }

      vi.mocked(esbuild.build).mockResolvedValue(mockResult as unknown as BuildResult)

      const result = await typescriptCompiler.compile(mockCode, {
        target: 'es2020',
        format: 'iife',
        minify: false,
      })

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0]).toContain('Expected ";" but found end of file')
    })

    it('should handle esbuild errors', async () => {
      const mockCode = 'const message: string = "Hello World";'
      const error = new Error('ESBuild initialization failed')

      // 清空缓存以确保测试的是新编译
      // 缓存机制已移除
      vi.mocked(esbuild.build).mockRejectedValue(error)

      const result = await typescriptCompiler.compile(mockCode, {
        target: 'es2020',
        format: 'iife',
        minify: false,
      })

      expect(result.success).toBe(false)
      expect(result.errors).toEqual(['ESBuild initialization failed'])
    })
  })

  describe('transform', () => {
    it('should successfully transform TypeScript code', async () => {
      const mockCode = 'const message: string = "Hello World";'
      const mockResult = {
        code: 'var message = "Hello World";',
        errors: [],
        warnings: [],
      }

      vi.mocked(esbuild.transform).mockResolvedValue(mockResult as unknown as esbuild.TransformResult)

      const result =       await typescriptCompiler.transform(mockCode, {
        loader: 'ts',
      })

      expect(result.success).toBe(true)
      expect(result.code).toBe('var message = "Hello World";')
    })
  })
})
