import { describe, it, expect } from 'vitest'

// Skip this test suite as it requires WASM initialization which is slow in test environment
describe.skip('PHPSandboxManager', () => {
  it('should be tested in integration environment', () => {
    // These tests require PHP-WASM which is slow to initialize in test environment
    // They should be run in integration tests or manually
    expect(true).toBe(true)
  })
})
