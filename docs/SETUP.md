# 项目设置指南

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd projectAIStartkit
```

### 2. 安装依赖
```bash
pnpm install
```

这一步会自动：
- 安装所有项目依赖
- 设置Git钩子（通过Husky）
- 配置代码质量检查工具

### 3. 开发
```bash
pnpm dev
```

## Git钩子

项目使用Husky自动管理Git钩子，确保代码质量：

- **Pre-commit**: 自动修复暂存文件的格式问题并进行TypeScript检查
- **Pre-push**: 在cursor分支上运行完整的代码质量检查（ESLint、格式化、测试）

详细说明请参考 [Git Hooks 配置说明](./GIT_HOOKS.md)

## 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器

# 构建
pnpm build            # 构建生产版本
pnpm preview          # 预览构建结果

# 代码质量
pnpm lint             # ESLint检查
pnpm lint:fix         # 自动修复ESLint问题
pnpm format:check     # 格式化检查
pnpm format           # 自动格式化代码

# 测试
pnpm test             # 运行测试
pnpm test:coverage    # 生成测试覆盖率报告
pnpm test:ui          # 启动测试UI界面

# 其他
pnpm knip             # 检查未使用的依赖
```

## 项目结构

```
src/
├── features/
│   └── code-runner/          # 代码运行器功能
│       ├── components/       # React组件
│       ├── services/         # 服务层
│       ├── security/         # 安全相关
│       ├── stores/           # 状态管理
│       └── examples/         # 代码示例
├── components/ui/            # 通用UI组件
├── lib/                      # 工具库
└── routes/                   # 路由配置
```

## 技术栈

- **前端框架**: React 19 + TypeScript
- **路由**: TanStack Router
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **代码编辑器**: Monaco Editor
- **测试**: Vitest + Testing Library
- **代码质量**: ESLint + Prettier
- **Git钩子**: Husky

## 故障排除

### Git钩子未生效
```bash
pnpm run prepare
```

### 依赖问题
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 测试失败
```bash
pnpm test --run
```

## 代码质量工具

### ESLint 自动修复

项目包含完整的 ESLint 自动修复工具，可以帮助快速修复代码风格和语法问题。

#### 可用命令

```bash
# 快速修复所有文件 (推荐)
pnpm run fix

# 修复指定目录
pnpm run fix src

# Git 提交前修复暂存文件
pnpm run fix:staged

# 仅运行 ESLint 自动修复
pnpm run lint:fix

# ESLint 修复 + Prettier 格式化
pnpm run lint:fix-all

# 使用高级自动修复程序
pnpm run lint:auto-fix
```

#### 工具特点

- 🚀 快速执行，简洁的进度显示
- 📊 详细的修复统计和错误报告
- ✅ 自动运行 ESLint + Prettier
- 🔍 修复后自动检查剩余问题
- 🎯 支持文件模式匹配和自定义配置

#### 使用建议

1. **开发时**: 使用 `pnpm run fix` 进行快速修复
2. **提交前**: 使用 `pnpm run fix:staged` 修复暂存文件
3. **CI/CD**: 使用 `pnpm run lint:fix-all` 确保代码质量
4. **大型重构**: 使用 `pnpm run lint:auto-fix` 获取详细报告

## 贡献指南

1. 确保所有测试通过
2. 遵循项目的代码规范
3. 提交前会自动运行代码质量检查
4. 在cursor分支上推送前会运行完整测试套件
