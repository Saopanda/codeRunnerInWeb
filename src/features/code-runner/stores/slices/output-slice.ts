/**
 * 输出状态切片
 * 管理代码执行输出和历史记录
 */

import type { StateCreator } from 'zustand'
import type { CodeOutput } from '../code-runner-store'

export interface OutputSlice {
  // 状态
  outputs: CodeOutput[]
  
  // 操作
  addOutput: (output: Omit<CodeOutput, 'id' | 'timestamp'>) => void
  clearOutputs: () => void
  removeOutput: (id: string) => void
  updateOutput: (id: string, updates: Partial<CodeOutput>) => void
  
  // 查询操作
  getOutputsByType: (type: CodeOutput['type']) => CodeOutput[]
  getOutputsBySource: (source: CodeOutput['source']) => CodeOutput[]
  getLatestOutput: () => CodeOutput | undefined
  getOutputCount: () => number
  
  // 计算属性
  getOutputStats: () => {
    total: number
    byType: Record<CodeOutput['type'], number>
    bySource: Record<CodeOutput['source'], number>
    hasErrors: boolean
    hasWarnings: boolean
  }
}

export const createOutputSlice: StateCreator<OutputSlice> = (set, get) => ({
  // 初始状态
  outputs: [],

  // 操作实现
  addOutput: (output: Omit<CodeOutput, 'id' | 'timestamp'>) => {
    const newOutput: CodeOutput = {
      ...output,
      id: `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }
    
    set((store) => ({
      outputs: [...store.outputs, newOutput]
    }))
  },

  clearOutputs: () => {
    set({ outputs: [] })
  },

  removeOutput: (id: string) => {
    set((store) => ({
      outputs: store.outputs.filter(output => output.id !== id)
    }))
  },

  updateOutput: (id: string, updates: Partial<CodeOutput>) => {
    set((store) => ({
      outputs: store.outputs.map(output =>
        output.id === id ? { ...output, ...updates } : output
      )
    }))
  },

  // 查询操作
  getOutputsByType: (type: CodeOutput['type']) => {
    return get().outputs.filter(output => output.type === type)
  },

  getOutputsBySource: (source: CodeOutput['source']) => {
    return get().outputs.filter(output => output.source === source)
  },

  getLatestOutput: () => {
    const outputs = get().outputs
    return outputs.length > 0 ? outputs[outputs.length - 1] : undefined
  },

  getOutputCount: () => {
    return get().outputs.length
  },

  // 计算属性
  getOutputStats: () => {
    const outputs = get().outputs
    
    const stats = {
      total: outputs.length,
      byType: {} as Record<CodeOutput['type'], number>,
      bySource: {} as Record<CodeOutput['source'], number>,
      hasErrors: false,
      hasWarnings: false
    }

    // 统计各类型和来源的输出数量
    outputs.forEach(output => {
      // 按类型统计
      stats.byType[output.type] = (stats.byType[output.type] || 0) + 1
      
      // 按来源统计
      stats.bySource[output.source] = (stats.bySource[output.source] || 0) + 1
      
      // 检查是否有错误或警告
      if (output.type === 'error') {
        stats.hasErrors = true
      }
      if (output.type === 'warn') {
        stats.hasWarnings = true
      }
    })

    return stats
  }
})
