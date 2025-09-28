import { describe, it, expect, beforeEach } from 'vitest'
import { useCodeRunnerStore } from '../code-runner-store'

describe('CodeRunnerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCodeRunnerStore.setState({
      code: '',
      language: 'javascript',
      executionState: {
        isRunning: false,
        isPaused: false,
        executionId: null,
        startTime: null,
        timeoutId: null,
        executionTime: null,
        firstExecutionTime: null
      },
      outputs: [],
      config: {
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
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
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useCodeRunnerStore.getState()

      expect(state.code).toBe('')
      expect(state.language).toBe('javascript')
      expect(state.executionState).toEqual({
        isRunning: false,
        isPaused: false,
        executionId: null,
        startTime: null,
        timeoutId: null,
        executionTime: null,
        firstExecutionTime: null
      })
      expect(state.outputs).toEqual([])
      expect(state.config).toEqual({
        timeout: 5000,
        maxMemory: 50 * 1024 * 1024,
        allowedAPIs: [],
        blockedAPIs: [],
      })
      expect(state.compileState).toEqual({
        isCompiling: false,
        compileErrors: [],
        compileWarnings: [],
        compileTime: null,
        firstCompileTime: null
      })
    })
  })

  describe('setCode', () => {
    it('should update code', () => {
      const newCode = 'console.log("Hello World");'
      
      useCodeRunnerStore.getState().setCode(newCode)
      
      expect(useCodeRunnerStore.getState().code).toBe(newCode)
    })
  })

  describe('setLanguage', () => {
    it('should update language to typescript', () => {
      useCodeRunnerStore.getState().setLanguage('typescript')
      
      expect(useCodeRunnerStore.getState().language).toBe('typescript')
    })

    it('should update language to javascript', () => {
      useCodeRunnerStore.getState().setLanguage('javascript')
      
      expect(useCodeRunnerStore.getState().language).toBe('javascript')
    })
  })

  describe('addOutput', () => {
    it('should add output to outputs array', () => {
      const output = {
        id: 'test-output',
        type: 'info' as const,
        message: 'Test message',
        source: 'console' as const,
        timestamp: Date.now(),
      }
      
      useCodeRunnerStore.getState().addOutput(output)
      
      const outputs = useCodeRunnerStore.getState().outputs
      expect(outputs).toHaveLength(1)
      expect(outputs[0].id).toBeDefined()
      expect(outputs[0].message).toBe('Test message')
      expect(outputs[0].type).toBe('info')
    })

    it('should generate unique ID if not provided', () => {
      const output = {
        type: 'info' as const,
        message: 'Test message',
        source: 'console' as const,
      }
      
      useCodeRunnerStore.getState().addOutput(output)
      
      const outputs = useCodeRunnerStore.getState().outputs
      expect(outputs).toHaveLength(1)
      expect(outputs[0].id).toBeDefined()
      expect(typeof outputs[0].id).toBe('string')
    })
  })

  describe('clearOutputs', () => {
    it('should clear all outputs', () => {
      // Add some outputs first
      useCodeRunnerStore.getState().addOutput({
        type: 'info',
        message: 'Message 1',
        source: 'console',
      })
      
      // Clear outputs
      useCodeRunnerStore.getState().clearOutputs()
      
      expect(useCodeRunnerStore.getState().outputs).toEqual([])
    })
  })

  describe('setCompileState', () => {
    it('should update compile state', () => {
      const newState = {
        isCompiling: true,
        compileErrors: ['Error 1'],
        compileWarnings: ['Warning 1'],
      }
      
      useCodeRunnerStore.getState().setCompileState(newState)
      
      const compileState = useCodeRunnerStore.getState().compileState
      expect(compileState.isCompiling).toBe(true)
      expect(compileState.compileErrors).toEqual(['Error 1'])
      expect(compileState.compileWarnings).toEqual(['Warning 1'])
    })
  })
})
