/**
 * 配置状态切片
 * 管理应用配置和设置
 */

import type { StateCreator } from 'zustand'
import type { SandboxConfig, CompileState } from '../code-runner-store'

export interface ConfigSlice {
  // 状态
  config: SandboxConfig
  compileState: CompileState
  
  // 配置操作
  updateConfig: (updates: Partial<SandboxConfig>) => void
  resetConfig: () => void
  setConfig: (config: SandboxConfig) => void
  
  // 编译状态操作
  setCompileState: (state: Partial<CompileState>) => void
  startCompilation: () => void
  completeCompilation: (errors?: string[], warnings?: string[]) => void
  clearCompileState: () => void
  
  // 计算属性
  getConfigSummary: () => {
    timeout: number
    maxMemory: number
    allowedAPIs: number
    blockedAPIs: number
  }
}

export const createConfigSlice: StateCreator<ConfigSlice> = (set, get) => ({
  // 初始状态
  config: {
    timeout: 5000,
    maxMemory: 50 * 1024 * 1024, // 50MB
    allowedAPIs: [],
    blockedAPIs: [],
  },

    compileState: {
      isCompiling: false,
      compileErrors: [],
      compileWarnings: [],
      compileTime: null,
      firstCompileTime: null
    },

  // 配置操作实现
  updateConfig: (updates: Partial<SandboxConfig>) => {
    set((store) => ({
      config: { ...store.config, ...updates }
    }))
  },

  resetConfig: () => {
    set({
      config: {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: [],
      }
    })
  },

  setConfig: (config: SandboxConfig) => {
    set({ config })
  },

  // 编译状态操作实现
  setCompileState: (state: Partial<CompileState>) => {
    set((store) => ({
      compileState: { ...store.compileState, ...state }
    }))
  },

  startCompilation: () => {
    set((store) => ({
      compileState: {
        ...store.compileState,
        isCompiling: true,
        compileErrors: [],
        compileWarnings: []
      }
    }))
  },

  completeCompilation: (errors?: string[], warnings?: string[]) => {
    set((store) => ({
      compileState: {
        ...store.compileState,
        isCompiling: false,
        compileErrors: errors || [],
        compileWarnings: warnings || [],
        compileTime: null,
        firstCompileTime: null
      }
    }))
  },

  clearCompileState: () => {
    set(() => ({
      compileState: {
        isCompiling: false,
        compileErrors: [],
        compileWarnings: [],
        compileTime: null,
        firstCompileTime: null
      }
    }))
  },

  // 计算属性
  getConfigSummary: () => {
    const config = get().config
    
    return {
      timeout: config.timeout,
      maxMemory: config.maxMemory,
      allowedAPIs: config.allowedAPIs.length,
      blockedAPIs: config.blockedAPIs.length
    }
  }
})
