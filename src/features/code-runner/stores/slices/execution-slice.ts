/**
 * 执行状态切片
 * 管理代码执行相关的状态
 */

import type { StateCreator } from 'zustand'
import type { CodeExecutionState } from '../code-runner-store'

export interface ExecutionSlice {
  // 状态
  executionState: CodeExecutionState
  
  // 操作
  setExecutionState: (state: Partial<CodeExecutionState>) => void
  startExecution: (executionId: string, startTime?: number) => void
  stopExecution: () => void
  pauseExecution: () => void
  resumeExecution: () => void
  setExecutionTimeout: (timeoutId: number) => void
  clearExecutionTimeout: () => void
  
  // 计算属性
  getExecutionStats: () => {
    isRunning: boolean
    isPaused: boolean
    duration: number
    executionId: string | null
  }
}

export const createExecutionSlice: StateCreator<ExecutionSlice> = (set, get) => ({
  // 初始状态
  executionState: {
    isRunning: false,
    isPaused: false,
    executionId: null,
    startTime: null,
    timeoutId: null,
    executionTime: null,
    firstExecutionTime: null
  },

  // 操作实现
  setExecutionState: (state: Partial<CodeExecutionState>) => {
    set((store) => ({
      executionState: { ...store.executionState, ...state }
    }))
  },

  startExecution: (executionId: string, startTime?: number) => {
    set((store) => ({
      executionState: {
        ...store.executionState,
        isRunning: true,
        isPaused: false,
        executionId,
        startTime: startTime || Date.now(),
        timeoutId: null
      }
    }))
  },

  stopExecution: () => {
    set((store) => {
      // 清除超时定时器
      if (store.executionState.timeoutId) {
        clearTimeout(store.executionState.timeoutId)
      }
      
      return {
        executionState: {
          ...store.executionState,
          isRunning: false,
          isPaused: false,
          executionId: null,
          startTime: null,
          timeoutId: null
        }
      }
    })
  },

  pauseExecution: () => {
    set((store) => ({
      executionState: {
        ...store.executionState,
        isPaused: true
      }
    }))
  },

  resumeExecution: () => {
    set((store) => ({
      executionState: {
        ...store.executionState,
        isPaused: false
      }
    }))
  },

  setExecutionTimeout: (timeoutId: number) => {
    set((store) => ({
      executionState: {
        ...store.executionState,
        timeoutId
      }
    }))
  },

  clearExecutionTimeout: () => {
    set((store) => {
      if (store.executionState.timeoutId) {
        clearTimeout(store.executionState.timeoutId)
      }
      
      return {
        executionState: {
          ...store.executionState,
          timeoutId: null
        }
      }
    })
  },

  // 计算属性
  getExecutionStats: () => {
    const state = get().executionState
    const duration = state.startTime ? Date.now() - state.startTime : 0
    
    return {
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      duration,
      executionId: state.executionId
    }
  }
})
