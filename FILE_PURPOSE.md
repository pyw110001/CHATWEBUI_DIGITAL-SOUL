# 项目文件用途说明

## 📁 核心配置文件（必需）

### 构建和开发配置
- **`package.json`** - 项目依赖和脚本配置，定义前后端统一启动命令
- **`package-lock.json`** - npm依赖锁定文件，确保依赖版本一致性
- **`tsconfig.json`** - TypeScript编译配置，定义类型检查和编译选项
- **`vite.config.ts`** - Vite构建工具配置，包含开发服务器、路径别名等设置
- **`vite-env.d.ts`** - Vite类型定义文件，声明图片等静态资源的导入类型

### 入口文件
- **`index.html`** - HTML入口文件，包含页面基础结构和Tailwind CSS CDN
- **`index.tsx`** - React应用入口，初始化React根节点并渲染App组件
- **`App.tsx`** - React主应用组件，管理页面路由和状态

### 类型和常量
- **`types.ts`** - TypeScript类型定义，包含Page枚举、Agent和Message接口
- **`constants.ts`** - 应用常量定义，包含初始智能体列表和配置

### Git配置
- **`.gitignore`** - Git忽略规则，排除node_modules、dist、.env等文件

---

## 📚 文档文件（建议保留）

- **`README.md`** - 项目主文档，包含项目介绍、快速开始、项目结构等
- **`START.md`** - 快速启动指南，详细的启动步骤说明
- **`API_KEY_CONFIG.md`** - API Key配置说明，指导如何配置ChatGLM API密钥
- **`FEATURES.md`** - 功能说明文档，列出项目所有功能特性
- **`DEPLOYMENT.md`** - 部署指南，生产环境部署说明
- **`CLOUDFLARE_DEPLOY.md`** - Cloudflare Pages部署文档，专门针对Cloudflare部署

---

## 🚀 部署相关文件

- **`cloudflare-pages.json`** - Cloudflare Pages构建配置，定义构建命令和输出目录
- **`_redirects`** - 重定向规则文件，用于SPA路由（所有路由重定向到index.html）

---

## 📂 目录结构

- **`server/`** - TypeScript后端服务，包含Express API服务器
- **`components/`** - React前端组件，包含页面组件和图标组件
- **`services/`** - 前端服务层，包含API调用和聊天历史管理
- **`assets/`** - 静态资源，包含图片、Logo等
- **`node_modules/`** - npm依赖包（自动生成，不应提交到Git）
- **`dist/`** - 构建输出目录（自动生成，不应提交到Git）
- **`.git/`** - Git版本控制目录

---

## ⚠️ 需要删除的文件/目录

### 已废弃的目录
- **`backend-ts/`** - 旧的TypeScript后端目录（已迁移到`server/`），现在是空目录，**应删除**

### 可能不需要的文件
- **`metadata.json`** - 元数据文件，代码中未引用，可能是用于某些平台配置，**可删除**（如果不影响部署）

---

## 🔧 配置说明

### vite.config.ts
包含 `GEMINI_API_KEY` 配置，用于支持 Gemini API（`services/geminiService.ts`）。项目同时支持 ChatGLM 和 Gemini 两种API：
- ChatGLM API：通过后端服务调用（主要使用）
- Gemini API：通过前端直接调用（可选功能）

如果确定不再使用 Gemini，可以：
1. 删除 `services/geminiService.ts`
2. 从 `package.json` 移除 `@google/genai` 依赖
3. 从 `vite.config.ts` 移除 GEMINI_API_KEY 相关配置

---

## ✅ 总结

**必需保留的文件：**
- 所有配置文件（package.json, tsconfig.json, vite.config.ts等）
- 所有源代码文件（App.tsx, index.tsx, types.ts等）
- 所有文档文件（README.md, START.md等）
- 部署配置文件（cloudflare-pages.json, _redirects）

**建议删除：**
- `backend-ts/` 目录（空目录）
- `metadata.json`（如果确认不需要）

