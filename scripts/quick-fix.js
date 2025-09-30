#!/usr/bin/env node

/**
 * 简单的 ESLint 快速修复工具
 *
 * 使用方法:
 *   pnpm run fix          # 修复所有文件
 *   pnpm run fix src      # 修复指定目录
 *   pnpm run fix:staged   # 修复暂存的文件 (适用于 git hooks)
 */

import { execSync } from 'child_process'
import path from 'path'

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function execCommand(command, description) {
  try {
    log(`🔧 ${description}...`, colors.cyan)
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    log(`✅ ${description} 完成`, colors.green)
    return { success: true, output: result }
  } catch (error) {
    const output = error.stdout || error.stderr || error.message
    if (output.trim()) {
      log(`⚠️  ${description} 输出:`, colors.yellow)
      console.log(output)
    }
    return { success: false, error: output }
  }
}

function quickFix(target = '.', options = {}) {
  log('🚀 开始快速修复...', colors.blue)
  log('='.repeat(40), colors.blue)

  const startTime = Date.now()
  let hasErrors = false

  // 1. ESLint 自动修复
  const eslintResult = execCommand(
    `npx eslint "${target}" --fix`,
    'ESLint 自动修复'
  )
  if (!eslintResult.success) hasErrors = true

  // 2. Prettier 格式化
  const prettierResult = execCommand(
    `npx prettier --write "${target}"`,
    'Prettier 格式化'
  )
  if (!prettierResult.success) hasErrors = true

  // 3. 检查结果
  log('\n📊 检查修复结果...', colors.cyan)

  const lintCheck = execCommand(
    `npx eslint "${target}"`,
    '检查剩余问题'
  )

  // 显示结果
  const duration = Date.now() - startTime
  log('\n' + '='.repeat(40), colors.blue)
  log(`⏱️  修复完成，耗时: ${duration}ms`, colors.blue)

  if (lintCheck.success) {
    log('🎉 所有问题已修复！', colors.green)
  } else {
    log('⚠️  仍有一些问题需要手动修复', colors.yellow)
    if (lintCheck.output && lintCheck.output.trim()) {
      log('剩余问题:', colors.yellow)
      console.log(lintCheck.output)
    }
  }

  return !hasErrors && lintCheck.success
}

function fixStagedFiles() {
  log('🔍 修复 Git 暂存文件...', colors.blue)

  try {
    // 获取暂存的文件
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8'
    })
      .split('\n')
      .filter(file => file.trim() && /\.(js|jsx|ts|tsx|vue)$/.test(file))

    if (stagedFiles.length === 0) {
      log('📝 没有找到需要修复的暂存文件', colors.yellow)
      return true
    }

    log(`📁 找到 ${stagedFiles.length} 个暂存文件需要修复`, colors.cyan)

    for (const file of stagedFiles) {
      log(`  处理: ${file}`, colors.cyan)

      // ESLint 修复
      execCommand(`npx eslint "${file}" --fix`, `修复 ${file}`)

      // Prettier 格式化
      execCommand(`npx prettier --write "${file}"`, `格式化 ${file}`)

      // 重新添加到暂存区
      execCommand(`git add "${file}"`, `重新暂存 ${file}`)
    }

    log('✅ 所有暂存文件修复完成', colors.green)
    return true

  } catch (error) {
    log(`❌ 修复暂存文件失败: ${error.message}`, colors.red)
    return false
  }
}

// 主程序
function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'staged':
      return fixStagedFiles()

    case 'help':
    case '--help':
    case '-h':
      console.log(`
ESLint 快速修复工具

使用方法:
  node scripts/quick-fix.js [目标]     # 修复指定目标 (默认: 当前目录)
  node scripts/quick-fix.js staged    # 修复 Git 暂存文件
  node scripts/quick-fix.js help      # 显示帮助

示例:
  node scripts/quick-fix.js           # 修复所有文件
  node scripts/quick-fix.js src       # 修复 src 目录
  node scripts/quick-fix.js staged    # 修复暂存文件
`)
      return true

    default:
      const target = command || '.'
      return quickFix(target)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const success = main()
  process.exit(success ? 0 : 1)
}