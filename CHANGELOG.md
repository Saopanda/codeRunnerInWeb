# 变更日志

## v1.0.0 (2025-01-27)

### Feat

- 实现多语言在线代码运行器
- 支持 JavaScript、TypeScript、PHP 三种编程语言
- 集成 Monaco Editor 提供专业代码编辑体验
- 实现安全沙箱执行环境
- 添加实时输出显示和错误处理
- 支持主题切换和响应式设计

### 技术栈

- React 19 + TypeScript + Vite
- Monaco Editor + shadcn/ui + Tailwind CSS
- Zustand 状态管理 + TanStack Router
- Web Worker + iframe + PHP-WASM 安全沙箱

### 测试

- 实现完整的单元测试覆盖
- 测试通过率 100% (194/194 通过)
- 覆盖核心功能：编译器、沙箱、安全分析、性能监控
- 集成 CI/CD 自动化测试
- 修复所有组件和服务测试问题

### 文档

- 完善项目文档和测试报告
- 更新 README 和使用指南
- 清理过时文档，保持文档一致性

---

*在线代码运行器 - 让代码学习更安全、更便捷！*