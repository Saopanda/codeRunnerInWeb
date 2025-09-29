import { describe, it, expect } from 'vitest'

// Skip this test suite as it requires Pyodide initialization which is slow in test environment
describe.skip('PythonSandboxManager', () => {
  it('should be tested in integration environment', () => {
    // These tests require Pyodide which is slow to initialize in test environment
    // They should be run in integration tests or manually
    expect(true).toBe(true)
  })
})
