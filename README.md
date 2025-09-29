# 在线代码运行器

一个安全的多语言在线代码运行器，支持 JavaScript、TypeScript、PHP 和 Python 的实时编辑和执行。基于 React + TypeScript + Vite 构建，使用 Monaco Editor 提供专业的代码编辑体验，支持科学计算库和数据可视化。

## ✨ 功能特性

### 🚀 核心功能
- **多语言支持**: JavaScript、TypeScript、PHP、Python 四种编程语言
- **专业代码编辑器**: 基于 Monaco Editor，支持语法高亮、自动补全
- **安全沙箱执行**: 在隔离环境中安全执行代码，支持多种语言
- **实时输出显示**: 支持 console.log、console.error 等输出
- **左右分屏布局**: 代码编辑器和输出结果并排显示，提高效率
- **主题切换**: 支持明暗主题
- **响应式设计**: 完美适配桌面和移动设备

### 🔒 安全特性
- **代码隔离**: 在安全沙箱中执行，防止恶意代码影响系统
- **API 限制**: 限制危险 API 的访问（eval、Function、document 等）
- **执行超时**: 防止无限循环，默认 10 秒超时
- **内存限制**: 限制代码执行的内存使用

### 🎨 界面特性
- **现代化 UI**: 基于 shadcn/ui 组件库
- **直观操作**: 一键运行、停止、保存、导出
- **实时反馈**: 执行状态、输出结果实时显示
- **分屏布局**: 代码编辑和结果查看同时进行，提升开发效率

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **代码编辑器**: Monaco Editor
- **UI 组件**: shadcn/ui (Radix UI + Tailwind CSS)
- **状态管理**: Zustand
- **路由管理**: TanStack Router
- **样式系统**: Tailwind CSS

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
```

### 构建生产版本
```bash
pnpm run build
```

### 预览生产版本
```bash
pnpm run preview
```

## 📖 使用指南

### 基本使用
1. 选择编程语言（JavaScript、TypeScript、PHP、Python）
2. 在左侧编辑器中编写代码
3. 点击"运行代码"按钮执行
4. 在右侧实时查看输出结果
5. 支持保存和导出代码

### 支持的语言特性

#### JavaScript/TypeScript
- ✅ ES6+ 语法
- ✅ 异步操作（Promise、async/await）
- ✅ 数组和对象操作
- ✅ 错误处理和调试
- ✅ 内置对象（Math、Date、JSON 等）

#### PHP
- ✅ PHP 8.1+ 语法
- ✅ 面向对象编程
- ✅ 常用内置函数
- ✅ 数组和字符串操作
- ✅ 错误处理和异常

#### Python
- ✅ Python 3.11+ 语法
- ✅ 科学计算库支持（NumPy、Pandas、Matplotlib）
- ✅ 数据处理和可视化
- ✅ 机器学习库（scikit-learn）
- ✅ 内置模块和标准库

### 限制的功能
- ❌ 不能访问 DOM（document、window）
- ❌ 不能使用 eval、Function 构造函数
- ❌ 不能访问 localStorage、sessionStorage
- ❌ 不能发起网络请求（fetch、XMLHttpRequest）
- ❌ 不能访问文件系统（PHP）

## 📁 项目结构

```
src/
├── features/
│   └── code-runner/           # 代码运行器核心功能
│       ├── components/        # UI 组件
│       │   ├── code-editor.tsx    # 代码编辑器
│       │   ├── output-display.tsx # 输出显示
│       │   ├── status-bar.tsx     # 状态栏
│       │   └── error-boundary.tsx # 错误边界
│       ├── services/          # 业务逻辑服务
│       │   ├── simple-sandbox.ts  # 简单沙箱
│       │   ├── php-sandbox.ts     # PHP 沙箱
│       │   ├── typescript-compiler.ts # TypeScript 编译
│       │   └── performance-monitor.ts  # 性能监控
│       ├── security/          # 安全模块
│       │   ├── security-manager.ts  # 安全管理器
│       │   ├── code-analysis.ts     # 代码分析
│       │   └── runtime-monitoring.ts # 运行时监控
│       ├── stores/           # 状态管理
│       │   ├── code-runner-store.ts # 主状态
│       │   └── slices/        # 状态切片
│       ├── examples/         # 示例代码
│       └── index.tsx         # 主页面
├── components/
│   └── ui/                   # 基础 UI 组件
├── context/                  # React Context
├── lib/                      # 工具函数
└── routes/                   # 路由配置
```

## 🔧 开发说明

### 添加新功能
1. 在 `features/code-runner/` 中添加组件
2. 更新状态管理（`stores/`）
3. 实现业务逻辑（`services/`）
4. 更新路由配置

### 代码管理
代码支持本地保存和导出：
- 保存到本地存储
- 导出为 .js 文件
- 支持主题切换

## 🌐 部署

### 静态部署
项目构建后生成静态文件，可部署到：
- Netlify
- Vercel
- GitHub Pages
- 任何静态文件服务器

### 环境变量
无需配置环境变量，纯前端应用。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

**在线代码运行器** - 让代码学习更安全、更便捷！ 🚀