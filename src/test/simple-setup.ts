import { createElement, type ReactNode } from 'react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'

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

    // Simulate editor mount
    if (onMount) {
      setTimeout(() => onMount(mockEditor, {}), 0)
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

// Simple test wrapper component
export const createWrapper = () => {
  return ({ children }: { children: ReactNode }) =>
    createElement('div', null, children)
}
