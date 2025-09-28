import * as esbuild from 'esbuild-wasm'

export interface CompileResult {
  success: boolean
  code?: string
  errors?: string[]
  warnings?: string[]
}

export interface CompileOptions {
  target?: string
  format?: 'esm' | 'cjs' | 'iife'
  minify?: boolean
  sourcemap?: boolean
}

class TypeScriptCompiler {
  private initialized = false
  private initializationPromise: Promise<void> | null = null

  async initialize(): Promise<void> {
    if (this.initialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this.doInitialize()
    return this.initializationPromise
  }

  private async doInitialize(): Promise<void> {
    try {
      await esbuild.initialize({
        wasmURL: '/esbuild.wasm'
      })
      this.initialized = true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to initialize esbuild: ${errorMessage}`)
    }
  }

  async compile(
    code: string, 
    options: CompileOptions = {}
  ): Promise<CompileResult> {
    if (!this.initialized) {
      await this.initialize()
    }

    const {
      target = 'es2020',
      format = 'iife',
      minify = false,
      sourcemap = false
    } = options

    // 缓存机制已移除，每次都重新编译

    try {
      const result = await esbuild.build({
        stdin: {
          contents: code,
          resolveDir: '/',
          sourcefile: 'input.ts',
          loader: 'ts' // 明确指定 TypeScript loader
        },
        bundle: true,
        format,
        target,
        minify,
        sourcemap,
        write: false,
        globalName: 'code',
        platform: 'browser',
        define: {
          'process.env.NODE_ENV': '"production"'
        },
        external: [
          // 排除一些可能不安全的模块
          'fs', 'path', 'os', 'crypto', 'buffer', 'util'
        ]
      })

      let compileResult: CompileResult

      if (result.errors.length > 0) {
        compileResult = {
          success: false,
          errors: result.errors.map(error => 
            `[${error.location?.file}:${error.location?.line}:${error.location?.column}] ${error.text}`
          )
        }
      } else if (result.warnings.length > 0) {
        compileResult = {
          success: true,
          code: result.outputFiles[0]?.text || '',
          warnings: result.warnings.map(warning => warning.text)
        }
      } else {
        compileResult = {
          success: true,
          code: result.outputFiles[0]?.text || ''
        }
      }

      // 缓存机制已移除，直接返回结果
      return compileResult

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown compilation error']
      }
    }
  }

  async transform(
    code: string,
    options: { loader?: 'ts' | 'tsx' | 'js' | 'jsx' } = {}
  ): Promise<CompileResult> {
    if (!this.initialized) {
      await this.initialize()
    }

    const { loader = 'ts' } = options

    try {
      const result = await esbuild.transform(code, {
        loader: loader || 'ts',
        target: 'es2020',
        format: 'iife',
        minify: false,
        sourcemap: false
      })

      return {
        success: true,
        code: result.code
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown transformation error']
      }
    }
  }

  isTypeScript(code: string): boolean {
    // 简单的 TypeScript 检测逻辑
    return (
      code.includes(':') && (
        code.includes('interface ') ||
        code.includes('type ') ||
        code.includes('enum ') ||
        code.includes('class ') ||
        code.includes('public ') ||
        code.includes('private ') ||
        code.includes('protected ') ||
        code.includes('abstract ') ||
        code.includes('as ') ||
        code.includes('<') && code.includes('>') // 泛型
      )
    ) || /:\s*(string|number|boolean|object|any|void|never|unknown)/.test(code)
  }

  // 缓存相关方法已移除

  /**
   * 检查是否支持该代码
   */
  isSupported(code: string): boolean {
    return this.isTypeScript(code) || true // TypeScript 编译器支持所有代码
  }
}

// 单例实例
export const typescriptCompiler = new TypeScriptCompiler()
