# 🔧 ESLint 自动修复工具

为了提高代码质量和开发效率，本项目已配置了完整的 ESLint 自动修复工具。

## 🚀 快速开始

```bash
# 修复所有代码问题 (推荐)
pnpm run fix

# 修复特定目录
pnpm run fix src

# Git 提交前修复暂存文件
pnpm run fix:staged
```

## 📋 可用命令

| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `pnpm run fix` | 快速修复所有文件 | 日常开发 |
| `pnpm run fix:staged` | 修复 Git 暂存文件 | 提交前检查 |
| `pnpm run lint:fix` | 仅 ESLint 修复 | 语法错误修复 |
| `pnpm run lint:fix-all` | ESLint + Prettier | 完整格式化 |
| `pnpm run lint:auto-fix` | 高级修复工具 | 详细报告需求 |

## 📖 详细文档

查看 [docs/ESLINT_AUTO_FIX.md](./docs/ESLINT_AUTO_FIX.md) 获取完整的使用指南和配置说明。

## 💡 开发建议

1. **开发时**: 使用 `pnpm run fix` 快速修复代码
2. **提交前**: 使用 `pnpm run fix:staged` 确保暂存文件符合规范
3. **CI/CD**: 可在构建流程中添加自动修复步骤