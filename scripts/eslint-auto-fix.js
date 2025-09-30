#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'
import path from 'path'

/**
 * ESLint 自动修复程序
 *
 * 功能：
 * 1. 运行 ESLint 自动修复
 * 2. 运行 Prettier 格式化
 * 3. 检查并报告修复结果
 * 4. 支持针对特定文件或目录的修复
 */

class ESLintAutoFixer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      eslintFixed: 0,
      prettierFixed: 0,
      errors: []
    }
  }

  /**
   * 执行命令并返回结果
   */
  execCommand(command, description) {
    try {
      console.log(`🔧 ${description}...`)
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
      console.log(`✅ ${description} 完成`)
      return { success: true, output: result }
    } catch (error) {
      console.warn(`⚠️  ${description} 时出现问题:`)
      console.warn(error.stdout || error.message)
      return { success: false, error: error.stdout || error.message }
    }
  }

  /**
   * 运行 ESLint 修复
   */
  runESLintFix(targetPath = '.') {
    console.log(`📋 正在运行 ESLint 自动修复 (${targetPath})...`)

    const result = this.execCommand(
      `npx eslint "${targetPath}" --fix --format=compact`,
      'ESLint 自动修复'
    )

    if (result.success) {
      this.stats.eslintFixed++
      if (result.output.trim()) {
        console.log('ESLint 输出:', result.output)
      }
    } else {
      this.stats.errors.push(`ESLint 修复失败: ${result.error}`)
    }

    return result.success
  }

  /**
   * 运行 Prettier 格式化
   */
  runPrettierFix(targetPath = '.') {
    console.log(`🎨 正在运行 Prettier 格式化 (${targetPath})...`)

    const result = this.execCommand(
      `npx prettier --write "${targetPath}"`,
      'Prettier 格式化'
    )

    if (result.success) {
      this.stats.prettierFixed++
    } else {
      this.stats.errors.push(`Prettier 格式化失败: ${result.error}`)
    }

    return result.success
  }

  /**
   * 检查修复后的状态
   */
  checkFixResults() {
    console.log(`🔍 正在检查修复结果...`)

    // 检查 ESLint
    const eslintCheck = this.execCommand(
      'npx eslint . --format=compact',
      '检查 ESLint 状态'
    )

    // 检查 Prettier
    const prettierCheck = this.execCommand(
      'npx prettier --check .',
      '检查 Prettier 状态'
    )

    return {
      eslintClean: eslintCheck.success,
      prettierClean: prettierCheck.success,
      eslintOutput: eslintCheck.output || eslintCheck.error,
      prettierOutput: prettierCheck.output || prettierCheck.error
    }
  }

  /**
   * 获取需要修复的文件列表
   */
  async getFilesToFix(pattern = '**/*.{js,jsx,ts,tsx,vue}') {
    try {
      const files = await glob(pattern, {
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
      })
      return files
    } catch (error) {
      console.error('获取文件列表失败:', error.message)
      return []
    }
  }

  /**
   * 修复特定文件
   */
  async fixSpecificFiles(files) {
    console.log(`📁 修复 ${files.length} 个文件...`)

    for (const file of files) {
      console.log(`  修复: ${file}`)
      this.runESLintFix(file)
      this.runPrettierFix(file)
      this.stats.filesProcessed++
    }
  }

  /**
   * 主要修复流程
   */
  async autoFix(targetPath = '.', options = {}) {
    const startTime = Date.now()

    console.log('🚀 开始 ESLint 自动修复程序')
    console.log('=' .repeat(50))

    try {
      // 如果指定了特定文件模式
      if (options.files) {
        const files = await this.getFilesToFix(options.files)
        await this.fixSpecificFiles(files)
      } else {
        // 标准修复流程
        this.runESLintFix(targetPath)
        this.runPrettierFix(targetPath)
      }

      // 检查修复结果
      const results = this.checkFixResults()

      // 显示结果
      this.printResults(results, Date.now() - startTime)

    } catch (error) {
      console.error('❌ 修复过程中发生错误:', error.message)
      process.exit(1)
    }
  }

  /**
   * 打印修复结果
   */
  printResults(results, duration) {
    console.log('\n' + '='.repeat(50))
    console.log('📊 修复结果汇总')
    console.log('='.repeat(50))

    console.log(`⏱️  耗时: ${duration}ms`)
    console.log(`📝 处理文件数: ${this.stats.filesProcessed || '全部'}`)
    console.log(`🔧 ESLint 修复: ${this.stats.eslintFixed > 0 ? '✅ 已执行' : '⚠️  未执行'}`)
    console.log(`🎨 Prettier 格式化: ${this.stats.prettierFixed > 0 ? '✅ 已执行' : '⚠️  未执行'}`)

    // ESLint 状态
    if (results.eslintClean) {
      console.log('✅ ESLint: 没有发现问题')
    } else {
      console.log('⚠️  ESLint: 仍有问题需要手动修复')
      if (results.eslintOutput) {
        console.log('   详情:', results.eslintOutput.substring(0, 200) + '...')
      }
    }

    // Prettier 状态
    if (results.prettierClean) {
      console.log('✅ Prettier: 代码格式正确')
    } else {
      console.log('⚠️  Prettier: 仍有格式问题')
      if (results.prettierOutput) {
        console.log('   详情:', results.prettierOutput.substring(0, 200) + '...')
      }
    }

    // 错误汇总
    if (this.stats.errors.length > 0) {
      console.log('\n❌ 错误汇总:')
      this.stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    console.log('\n🎉 修复程序执行完成!')

    // 给出建议
    if (!results.eslintClean || !results.prettierClean) {
      console.log('\n💡 建议:')
      if (!results.eslintClean) {
        console.log('   - 运行 `pnpm lint` 查看剩余的 ESLint 问题')
      }
      if (!results.prettierClean) {
        console.log('   - 运行 `pnpm format:check` 查看格式问题')
      }
    }
  }
}

// 命令行接口
function main() {
  const args = process.argv.slice(2)
  const fixer = new ESLintAutoFixer()

  // 解析命令行参数
  const options = {}
  let targetPath = '.'

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--files':
      case '-f':
        options.files = args[++i]
        break
      case '--path':
      case '-p':
        targetPath = args[++i]
        break
      case '--help':
      case '-h':
        console.log(`
ESLint 自动修复程序

用法:
  node scripts/eslint-auto-fix.js [选项]

选项:
  -f, --files <pattern>    指定文件模式 (例如: "src/**/*.ts")
  -p, --path <path>        指定目标路径 (默认: ".")
  -h, --help              显示帮助信息

示例:
  node scripts/eslint-auto-fix.js                    # 修复所有文件
  node scripts/eslint-auto-fix.js -f "src/**/*.ts"   # 只修复 TypeScript 文件
  node scripts/eslint-auto-fix.js -p src             # 只修复 src 目录
        `)
        process.exit(0)
        break
      default:
        if (!arg.startsWith('-')) {
          targetPath = arg
        }
    }
  }

  // 执行修复
  fixer.autoFix(targetPath, options)
}

// 如果是直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default ESLintAutoFixer