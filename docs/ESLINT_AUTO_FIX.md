# ESLint 自动修复工具

本项目包含了一套完整的 ESLint 自动修复工具，可以帮助您快速修复代码风格和语法问题。

## 可用命令

### 基础修复命令

```bash
# 快速修复所有文件 (推荐)
pnpm run fix

# 修复指定目录
pnpm run fix src

# 仅运行 ESLint 自动修复
pnpm run lint:fix

# ESLint 修复 + Prettier 格式化
pnpm run lint:fix-all
```

### 高级修复命令

```bash
# 使用高级自动修复程序
pnpm run lint:auto-fix

# 修复 Git 暂存文件 (适用于 pre-commit hooks)
pnpm run fix:staged
```

### 检查命令

```bash
# 检查 ESLint 问题
pnpm run lint

# 检查 Prettier 格式
pnpm run format:check

# 运行 Prettier 格式化
pnpm run format
```

## 工具说明

### 1. 快速修复工具 (`quick-fix.js`)

这是最常用的修复工具，适合日常开发使用。

**特点:**
- 🚀 快速执行
- 📊 简洁的进度显示
- ✅ 自动运行 ESLint + Prettier
- 🔍 修复后自动检查剩余问题

**使用场景:**
- 日常开发中的代码修复
- 提交前的快速清理
- CI/CD 流程中的代码格式化

### 2. 高级自动修复程序 (`eslint-auto-fix.js`)

这是功能更完整的修复工具，提供详细的报告和灵活的配置。

**特点:**
- 📈 详细的修复统计
- 🎯 支持文件模式匹配
- ⚙️ 可配置的修复选项
- 📋 完整的错误报告

**使用场景:**
- 大型代码库的批量修复
- 需要详细报告的场景
- 自定义修复流程

## 使用示例

### 开发过程中修复代码

```bash
# 修复当前所有代码
pnpm run fix

# 只修复 src 目录
pnpm run fix src
```

### Git 提交前修复

```bash
# 修复暂存的文件
pnpm run fix:staged
```

### 高级使用

```bash
# 使用高级修复工具
pnpm run lint:auto-fix

# 修复特定文件类型
pnpm run lint:auto-fix -f "**/*.ts"

# 修复指定路径
pnpm run lint:auto-fix -p src/components
```

## 配置文件

项目根目录的 `.eslint-auto-fix.json` 文件包含了自动修复的配置选项：

```json
{
  "eslintAutoFix": {
    "defaultTargets": [
      "src/**/*.{js,jsx,ts,tsx}",
      "scripts/**/*.{js,ts}",
      "*.{js,ts}"
    ],
    "excludePatterns": [
      "node_modules/**",
      "dist/**",
      "build/**"
    ],
    "autoFixRules": {
      "enabled": true
    },
    "prettierIntegration": {
      "enabled": true,
      "runAfterEslint": true
    }
  }
}
```

## Git Hooks 集成

您可以将修复命令集成到 Git hooks 中：

### Pre-commit Hook

在 `.git/hooks/pre-commit` 中添加：

```bash
#!/bin/sh
# 修复暂存的文件
pnpm run fix:staged
```

或者使用 `husky` 和 `lint-staged`：

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "pnpm run fix",
      "git add"
    ]
  }
}
```

## 常见问题

### Q: 修复后仍有 ESLint 错误

A: 有些 ESLint 规则无法自动修复，需要手动处理。运行 `pnpm run lint` 查看具体问题。

### Q: 修复速度较慢

A: 对于大型项目，建议使用 `pnpm run fix src` 指定目录，或使用文件模式匹配。

### Q: 如何添加自定义修复规则

A: 编辑 `.eslint-auto-fix.json` 配置文件，或修改 `scripts/eslint-auto-fix.js` 脚本。

## 最佳实践

1. **开发时**: 使用 `pnpm run fix` 进行快速修复
2. **提交前**: 使用 `pnpm run fix:staged` 修复暂存文件
3. **CI/CD**: 使用 `pnpm run lint:fix-all` 确保代码质量
4. **大型重构**: 使用 `pnpm run lint:auto-fix` 获取详细报告

## 工具输出示例

```bash
$ pnpm run fix

🚀 开始快速修复...
========================================
🔧 ESLint 自动修复...
✅ ESLint 自动修复 完成
🔧 Prettier 格式化...
✅ Prettier 格式化 完成

📊 检查修复结果...
🔧 检查剩余问题...
✅ 检查剩余问题 完成

========================================
⏱️  修复完成，耗时: 1247ms
🎉 所有问题已修复！
```

这套工具将帮助您维护一致的代码风格，提高开发效率！