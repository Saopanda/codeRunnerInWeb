import { createElement, type ReactNode } from 'react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// CI 环境检测
const isCI = Boolean(
  process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS
)

// CI 环境优化设置
if (isCI) {
  // 设置稳定的时区用于测试
  process.env.TZ = process.env.TZ || 'UTC'

  // 增加 CI 环境的超时时间
  vi.setConfig({
    testTimeout: 15000,
    hookTimeout: 10000,
  })
}

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  Editor: vi.fn(({ onMount, value }) => {
    const mockEditor = {
      getValue: vi.fn(() => value || ''),
      setValue: vi.fn(),
      focus: vi.fn(),
      dispose: vi.fn(),
      updateOptions: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => value || ''),
        setValue: vi.fn(),
        dispose: vi.fn(),
      })),
      onDidChangeModelContent: vi.fn(),
    }

    // Simulate editor mount with CI-friendly delay
    if (onMount) {
      setTimeout(() => onMount(mockEditor, {}), isCI ? 10 : 0)
    }

    return null
  }),
}))

// Mock esbuild-wasm
vi.mock('esbuild-wasm', () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  build: vi.fn().mockResolvedValue({
    errors: [],
    warnings: [],
    outputFiles: [{ text: 'console.log("Hello World");' }],
  }),
  transform: vi.fn().mockResolvedValue({
    code: 'console.log("Hello World");',
    errors: [],
    warnings: [],
  }),
}))

// Mock global objects
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock performance for CI environments
if (isCI && typeof performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  } as unknown as Performance
}

// Mock requestAnimationFrame for CI
global.requestAnimationFrame = vi.fn(
  (cb) => setTimeout(cb, isCI ? 16 : 0) as unknown as number
)
global.cancelAnimationFrame = vi.fn()

// Simple test wrapper component
export const createWrapper = () => {
  return ({ children }: { children: ReactNode }) =>
    createElement('div', null, children)
}

// 导出 CI 状态供测试使用
export { isCI }
