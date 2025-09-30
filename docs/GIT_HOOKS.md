# Git Hooks 配置说明

本项目使用 [Husky](https://typicode.github.io/husky/) 来管理Git钩子，确保代码质量检查可以远程分发给团队成员。

## 安装和设置

当团队成员克隆项目并运行 `pnpm install` 时，Husky会自动设置Git钩子。

## Pre-commit Hook (所有分支)

**文件位置**: `.husky/pre-commit`

**触发时机**: 在每次 `git commit` 之前自动运行

**执行内容**:
1. `pnpm run fix:staged` - 自动修复暂存文件的ESLint和格式化问题
2. `pnpm tsc -b` - TypeScript编译检查

**作用**: 确保每次提交的代码都符合项目标准，避免将格式问题或类型错误提交到版本库。

## Pre-push Hook (仅cursor分支)

**文件位置**: `.husky/pre-push`

**触发时机**: 在每次 `git push` 之前自动运行

**分支限制**: 仅在 `cursor` 分支上执行，其他分支会跳过检查

**执行内容**:
1. `pnpm lint` - ESLint代码质量检查
2. `pnpm format:check` - Prettier格式化检查
3. `pnpm test` - 运行所有测试

**作用**: 确保推送到cursor分支的代码通过所有质量检查，包括代码规范、格式化和测试。

## 团队协作

### 新成员设置
当新成员加入项目时，只需要：
```bash
git clone <repository-url>
cd <project-directory>
pnpm install
```

Husky会自动设置Git钩子，无需额外配置。

### 手动重新安装钩子
如果需要重新安装钩子：
```bash
pnpm run prepare
```

## 使用说明

### 正常提交流程
```bash
# 1. 添加文件到暂存区
git add .

# 2. 提交（自动运行pre-commit钩子）
git commit -m "feat: add new feature"

# 3. 推送（在cursor分支上自动运行pre-push钩子）
git push origin cursor
```

### 跳过钩子（不推荐）
```bash
# 跳过pre-commit钩子
git commit --no-verify -m "message"

# 跳过pre-push钩子
git push --no-verify origin cursor
```

## 故障排除

### Pre-commit失败
如果pre-commit钩子失败，通常是因为：
- ESLint错误：运行 `pnpm lint:fix` 修复
- TypeScript错误：检查类型定义和导入
- 格式化问题：运行 `pnpm format` 修复

### Pre-push失败
如果pre-push钩子在cursor分支上失败，检查：
- ESLint错误：运行 `pnpm lint:fix`
- 格式化问题：运行 `pnpm format`
- 测试失败：运行 `pnpm test` 查看详细错误

## 钩子文件权限

确保钩子文件具有执行权限：
```bash
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push
```

## 注意事项

1. **性能影响**: pre-push钩子会运行完整测试套件，可能需要较长时间
2. **分支策略**: pre-push检查仅在cursor分支上运行，其他分支不受影响
3. **错误处理**: 钩子失败会阻止操作完成，确保代码质量
4. **自动化**: 钩子会自动修复可修复的问题（如格式化），无需手动干预
5. **版本控制**: Husky钩子文件在版本控制中，确保团队一致性
6. **依赖管理**: 钩子依赖于package.json中的`prepare`脚本，确保Husky正确安装

## 故障排除

### Husky钩子未生效
如果钩子没有自动运行：
```bash
# 重新安装钩子
pnpm run prepare

# 检查钩子文件权限
ls -la .husky/
```

### 钩子执行失败
参考上述故障排除部分，或者临时跳过：
```bash
# 跳过所有钩子
git commit --no-verify -m "message"
git push --no-verify origin cursor
```
