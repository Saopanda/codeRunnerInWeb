/**
 * 代码状态切片
 * 管理代码内容和语言设置
 */

import type { StateCreator } from 'zustand'
import type { Language } from '../code-runner-store'

export interface CodeSlice {
  // 状态
  code: string
  language: Language
  
  // 操作
  setCode: (code: string) => void
  setLanguage: (language: Language) => void
  clearCode: () => void
  updateCode: (updater: (current: string) => string) => void
  
  // 计算属性
  getCodeStats: () => {
    length: number
    lines: number
    isEmpty: boolean
    wordCount: number
  }
}

export const createCodeSlice: StateCreator<CodeSlice> = (set, get) => ({
  // 初始状态
  code: '',
  language: 'javascript',

  // 操作实现
  setCode: (code: string) => {
    set({ code })
  },

  setLanguage: (language: Language) => {
    set({ language })
  },

  clearCode: () => {
    set({ code: '' })
  },

  updateCode: (updater: (current: string) => string) => {
    const currentCode = get().code
    const newCode = updater(currentCode)
    set({ code: newCode })
  },

  // 计算属性
  getCodeStats: () => {
    const code = get().code
    const lines = code.split('\n').length
    const words = code.trim() ? code.trim().split(/\s+/).length : 0
    
    return {
      length: code.length,
      lines,
      isEmpty: code.trim().length === 0,
      wordCount: words
    }
  }
})
