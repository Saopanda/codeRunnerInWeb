# 项目文档索引

本文档目录包含了在线代码运行器项目的所有技术文档。

## 📁 文档结构

### 📋 项目文档
- [`SETUP.md`](./SETUP.md) - 项目设置和开发指南
- [`GIT_HOOKS.md`](./GIT_HOOKS.md) - Git钩子配置说明

### 🧪 测试文档
- [`testing/COVERAGE_REPORT.md`](./testing/COVERAGE_REPORT.md) - 详细测试覆盖率报告

### 📖 产品文档
- [`.cursor/rules/CODE_RUNNER_PRD.mdc`](../.cursor/rules/CODE_RUNNER_PRD.mdc) - 产品需求文档
- [`.cursor/rules/CODE_RUNNER_TAD.mdc`](../.cursor/rules/CODE_RUNNER_TAD.mdc) - 技术架构设计文档

## 📝 文档说明

### 项目设置文档
- **SETUP.md**: 包含项目设置、开发指南、代码质量工具使用说明
- **GIT_HOOKS.md**: Git钩子配置和使用说明

### 测试文档
- **COVERAGE_REPORT.md**: 详细的测试覆盖率报告，包含测试统计、修复状态和质量指标

### 产品文档
- **CODE_RUNNER_PRD.mdc**: 产品需求文档，包含功能需求、用户故事、验收标准
- **CODE_RUNNER_TAD.mdc**: 技术架构文档，包含架构设计、数据模型、接口定义

## 🔄 文档维护

### 更新原则
1. **及时更新**: 功能实现后及时更新相关文档
2. **内容准确**: 文档内容应反映项目的真实状态和功能
3. **避免重复**: 不创建重复或冗余的文档
4. **结构清晰**: 保持文档结构的一致性和可读性

### 文档类型
- **项目文档**: 设置指南、开发说明、工具使用
- **测试文档**: 测试策略、覆盖范围和结果
- **产品文档**: 需求规格、架构设计、技术决策

## 📊 项目状态

### 功能完成度
- ✅ **多语言支持**: JavaScript、TypeScript、PHP、Python
- ✅ **安全沙箱**: Web Worker + iframe + WASM 隔离
- ✅ **代码编辑器**: Monaco Editor 集成
- ✅ **测试覆盖**: 194个测试用例，100%通过率
- ✅ **文档完善**: 所有文档已更新并与实际进展一致

### 技术栈
- **前端**: React 19 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **代码编辑器**: Monaco Editor
- **测试**: Vitest + Testing Library
- **代码质量**: ESLint + Prettier + Husky

## 📝 文档贡献

如需添加新文档或更新现有文档，请遵循以下原则：

1. **文档位置**: 放在合适的子目录中
2. **命名规范**: 使用清晰描述内容的文件名
3. **内容准确**: 保持与项目实际状态一致
4. **结构一致**: 遵循现有的文档结构和格式
5. **及时清理**: 删除过期或无效的文档

---

*最后更新: 2025-01-27*  
*文档状态: 已更新，与项目实际进展保持一致*  
*测试状态: 194个测试用例，100%通过率*