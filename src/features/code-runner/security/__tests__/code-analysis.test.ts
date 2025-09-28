import { describe, it, expect, beforeEach } from 'vitest'
import { CodeAnalysisLayer } from '../code-analysis'

describe('CodeAnalysisLayer', () => {
  let analyzer: CodeAnalysisLayer

  beforeEach(() => {
    analyzer = new CodeAnalysisLayer()
  })

  describe('analyze', () => {
    it('should detect eval usage', () => {
      const code = 'eval("console.log(\'hello\')")'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('critical')
      expect(result.riskLevel).toBe('critical')
    })

    it('should detect Function constructor usage', () => {
      const code = 'const fn = new Function("return 42")'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('critical')
    })

    it('should detect DOM access', () => {
      const code = 'document.getElementById("test")'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('high')
    })

    it('should detect window access', () => {
      const code = 'window.location.href'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('high')
    })

    it('should detect localStorage usage', () => {
      const code = 'localStorage.setItem("key", "value")'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('medium')
    })

    it('should detect fetch API usage', () => {
      const code = 'fetch("https://api.example.com")'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('high')
    })

    it('should detect infinite loops', () => {
      const code = 'while(true) { console.log("loop") }'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('suspicious_pattern')
      expect(result.issues[0].severity).toBe('high')
    })

    it('should detect string-based setTimeout', () => {
      const code = 'setTimeout("console.log(\'hello\')", 1000)'
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('dangerous_api')
      expect(result.issues[0].severity).toBe('high')
    })

    it('should allow safe code', () => {
      const code = `
        const message = "Hello, World!";
        console.log(message);
        
        function add(a, b) {
          return a + b;
        }
        
        const result = add(2, 3);
        console.log(result);
      `
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.riskLevel).toBe('low')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should calculate risk level correctly', () => {
      // Low risk
      const lowRiskCode = 'console.log("hello")'
      const lowRiskResult = analyzer.analyze(lowRiskCode)
      expect(lowRiskResult.riskLevel).toBe('low')

      // Medium risk - need more medium severity issues
      const mediumRiskCode = `
        localStorage.getItem("key"); 
        sessionStorage.setItem("key", "value");
        document.getElementById("test");
        window.location.href;
      `
      const mediumRiskResult = analyzer.analyze(mediumRiskCode)
      expect(mediumRiskResult.riskLevel).toBe('medium')

      // High risk
      const highRiskCode = 'document.getElementById("test"); window.location.href; document.body; window.location.reload(); fetch("http://example.com"); XMLHttpRequest()'
      const highRiskResult = analyzer.analyze(highRiskCode)
      expect(highRiskResult.riskLevel).toBe('high')

      // Critical risk
      const criticalRiskCode = 'eval("console.log(\'hello\')")'
      const criticalRiskResult = analyzer.analyze(criticalRiskCode)
      expect(criticalRiskResult.riskLevel).toBe('critical')
    })

    it('should provide line numbers for issues', () => {
      const code = `
        console.log("line 2");
        eval("console.log('line 3')");
        console.log("line 4");
      `
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].line).toBe(3)
    })

    it('should analyze code complexity', () => {
      // Create a deeply nested function (more than 15 levels)
      const complexCode = `
        function level1() {
          function level2() {
            function level3() {
              function level4() {
                function level5() {
                  function level6() {
                    function level7() {
                      function level8() {
                        function level9() {
                          function level10() {
                            function level11() {
                              function level12() {
                                function level13() {
                                  function level14() {
                                    function level15() {
                                      function level16() {
                                        function level17() {
                                          function level18() {
                                            function level19() {
                                              function level20() {
                                                console.log("deep nesting");
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
      const result = analyzer.analyze(complexCode)

      expect(result.safe).toBe(false)
      const complexityIssue = result.issues.find(issue => 
        issue.message.includes('嵌套深度')
      )
      expect(complexityIssue).toBeDefined()
      expect(complexityIssue?.severity).toBe('medium')
    })

    it('should detect multiple issues', () => {
      const code = `
        eval("console.log('eval')");
        document.getElementById("test");
        localStorage.setItem("key", "value");
        while(true) { console.log("loop"); }
      `
      const result = analyzer.analyze(code)

      expect(result.safe).toBe(false)
      expect(result.issues.length).toBeGreaterThan(3)
      expect(result.riskLevel).toBe('critical')
    })
  })
})
