# 项目部署通用指南

本指南适用于所有需要通过 Vercel、Netlify、Cloudflare Pages 等平台部署的前后端一体化项目。

## 📋 目录

1. [项目整理检查清单](#项目整理检查清单)
2. [部署前准备](#部署前准备)
3. [Vercel 部署流程](#vercel-部署流程)
4. [其他平台部署](#其他平台部署)
5. [部署后验证](#部署后验证)
6. [常见问题排查](#常见问题排查)
7. [最佳实践](#最佳实践)

---

## 📦 项目整理检查清单

在部署前，请确保项目结构清晰、配置完整。

### 1. 项目结构检查

```
项目根目录/
├── package.json          # 前端依赖和脚本
├── vite.config.ts        # 或 webpack.config.js 等构建配置
├── tsconfig.json         # TypeScript 配置（如使用 TS）
├── vercel.json           # Vercel 部署配置（如使用 Vercel）
├── .gitignore           # Git 忽略规则
├── README.md            # 项目说明
│
├── server/              # 后端目录（如适用）
│   ├── package.json     # 后端依赖
│   ├── tsconfig.json    # 后端 TS 配置
│   ├── src/            # 后端源代码
│   └── api/            # Serverless 入口（如适用）
│
├── src/ 或 components/  # 前端源代码
├── public/              # 静态资源
└── dist/                # 构建输出（不应提交到 Git）
```

### 2. 配置文件检查

#### ✅ package.json 检查

**前端 package.json**：
```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",                    // 开发服务器
    "build": "vite build",             // 构建命令（必需）
    "preview": "vite preview",        // 预览构建结果
    "vercel-build": "npm run build"   // Vercel 构建命令（如使用 Vercel）
  },
  "dependencies": {
    // 生产依赖
  },
  "devDependencies": {
    // 开发依赖
  }
}
```

**后端 package.json**（如适用）：
```json
{
  "name": "backend-service",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

#### ✅ 构建配置检查

- **Vite 项目**：检查 `vite.config.ts` 中的 `build.outDir`（默认 `dist`）
- **Webpack 项目**：检查 `output.path` 配置
- **Next.js 项目**：通常无需额外配置

#### ✅ 环境变量检查

**创建 `.env.example` 文件**（模板，不含敏感信息）：
```env
# 前端环境变量（Vite 项目需要 VITE_ 前缀）
VITE_API_BASE_URL=https://api.example.com

# 后端环境变量
API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

**确保 `.env` 在 `.gitignore` 中**：
```
.env
.env.local
.env.*.local
```

### 3. 代码检查

#### ✅ API 调用配置

**前端 API 调用应支持环境变量**：
```typescript
// ✅ 正确：支持环境变量和相对路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:8000');

// ❌ 错误：硬编码 localhost
const API_BASE_URL = 'http://localhost:8000';
```

**生产环境应使用相对路径**（前后端同域时）：
```typescript
// 生产环境：使用相对路径
// 开发环境：使用 localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:8000');
```

#### ✅ CORS 配置

**后端 CORS 配置**（如适用）：
```typescript
// 支持环境变量配置允许的源
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000'
];

// 支持平台域名正则（如 Vercel、Cloudflare Pages）
const allowedOriginRegex = /^https:\/\/.*\.(vercel\.app|pages\.dev)$/;
```

#### ✅ 路由配置

**SPA 路由处理**：
- 确保所有前端路由都指向 `index.html`
- 在 `vercel.json` 或平台配置中设置重定向规则

### 4. 依赖检查

#### ✅ 清理无用依赖

```bash
# 检查未使用的依赖
npm install -g depcheck
depcheck

# 清理 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install
```

#### ✅ 锁定依赖版本

- 使用 `package-lock.json`（npm）或 `yarn.lock`（yarn）
- 确保依赖版本兼容

### 5. 构建测试

```bash
# 本地构建测试
npm run build

# 检查构建输出
ls -la dist/  # 或 build/

# 本地预览构建结果
npm run preview
```

**检查构建输出**：
- ✅ `index.html` 存在
- ✅ JavaScript/CSS 文件已生成
- ✅ 静态资源路径正确
- ✅ 无构建错误或警告

---

## 🚀 部署前准备

### 1. Git 仓库准备

```bash
# 确保代码已提交
git status

# 创建 .gitignore（如未创建）
cat > .gitignore << EOF
node_modules/
dist/
build/
.env
.env.local
.env.*.local
*.log
.DS_Store
EOF

# 提交所有更改
git add .
git commit -m "Prepare for deployment"
git push
```

### 2. 环境变量准备

**列出所有需要的环境变量**：
- 前端环境变量（Vite 需要 `VITE_` 前缀）
- 后端环境变量（API Keys、数据库连接等）

**创建环境变量清单**（`ENV_VARIABLES.md`）：
```markdown
# 环境变量清单

## 必需
- CHATGLM_API_KEY: API 密钥

## 可选
- CHATGLM_MODEL: 模型名称（默认：glm-4.5-airx）
```

### 3. 平台账号准备

- ✅ Vercel：https://vercel.com
- ✅ Netlify：https://netlify.com
- ✅ Cloudflare Pages：https://pages.cloudflare.com

---

## 🌐 Vercel 部署流程

### 方法一：通过 Dashboard（推荐）

#### 步骤 1：导入项目

1. 访问 https://vercel.com
2. 点击 "Add New Project"
3. 选择 Git 仓库（GitHub/GitLab/Bitbucket）
4. Vercel 会自动检测项目配置

#### 步骤 2：配置项目设置

**Root Directory**：留空（项目根目录）

**Build Settings**：
- **Framework Preset**：根据项目选择（Vite、Next.js、Create React App 等）
- **Build Command**：`npm run build`（或 `npm run vercel-build`）
- **Output Directory**：`dist`（或 `build`，根据构建配置）
- **Install Command**：`npm install`（如需要安装后端依赖，添加 `&& cd server && npm install`）

> **注意**：如果 `vercel.json` 中已配置，Vercel 会自动使用配置，无需在 Dashboard 中设置。

#### 步骤 3：配置环境变量

在 **Settings** → **Environment Variables** 中添加：

**必需的环境变量**：
```
CHATGLM_API_KEY=your_api_key_here
```

**可选的环境变量**：
```
CHATGLM_MODEL=glm-4.5-airx
```

**不需要设置**：
- ❌ `PORT` - Vercel 自动设置
- ❌ `NODE_ENV` - Vercel 自动设置为 `production`
- ❌ `VITE_API_BASE_URL` - 前后端同域时使用相对路径

**环境变量作用域**：
- ✅ Production：生产环境
- ✅ Preview：预览环境（PR 部署）
- ✅ Development：开发环境

#### 步骤 4：部署

1. 点击 "Deploy"
2. 等待构建完成（查看构建日志）
3. 部署成功后获得 URL：`https://your-project.vercel.app`

### 方法二：通过 CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在项目根目录部署
vercel

# 生产环境部署
vercel --prod
```

### vercel.json 配置模板

**前后端一体化项目**：
```json
{
  "version": 2,
  "installCommand": "npm install && cd server && npm install",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/api/index.ts"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*\\.(js|css|ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**纯前端项目**：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 🔄 其他平台部署

### Netlify

**netlify.toml**：
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Cloudflare Pages

**cloudflare-pages.json**：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Railway / Render

**适用于后端服务**：
- 使用 `Dockerfile` 或 `Procfile`
- 配置环境变量
- 设置启动命令

---

## ✅ 部署后验证

### 1. 基础检查

- [ ] 访问网站首页，页面正常加载
- [ ] 检查浏览器控制台，无错误
- [ ] 检查 Network 标签，资源加载正常

### 2. API 检查

- [ ] 访问 API 健康检查端点：`/api/health`
- [ ] 测试主要 API 功能
- [ ] 检查 API 响应时间

### 3. 功能测试

- [ ] 测试核心功能流程
- [ ] 测试用户交互
- [ ] 测试错误处理

### 4. 性能检查

- [ ] 使用 Lighthouse 检查性能
- [ ] 检查首屏加载时间
- [ ] 检查资源大小

---

## 🐛 常见问题排查

### 问题 1：构建失败

**可能原因**：
- 依赖安装失败
- 构建命令错误
- TypeScript 编译错误

**解决方案**：
```bash
# 本地测试构建
npm run build

# 检查构建日志
# 在 Vercel Dashboard 中查看构建日志
```

### 问题 2：404 错误

**可能原因**：
- 路由配置错误
- 静态文件路径错误

**解决方案**：
- 检查 `vercel.json` 中的路由配置
- 确保 SPA 路由指向 `index.html`
- 检查构建输出目录

### 问题 3：API 连接失败

**可能原因**：
- API 基础 URL 配置错误
- CORS 配置问题
- 环境变量未设置

**解决方案**：
```typescript
// 检查前端 API 配置
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);

// 检查后端环境变量
console.log('API Key configured:', !!process.env.CHATGLM_API_KEY);
```

### 问题 4：环境变量未生效

**解决方案**：
- 在平台 Dashboard 中重新设置环境变量
- 确保环境变量名称正确（注意大小写）
- 重新部署项目

### 问题 5：静态资源 404

**解决方案**：
- 检查资源路径（使用相对路径）
- 检查 `public` 目录配置
- 检查构建输出中的资源路径

---

## 💡 最佳实践

### 1. 项目结构

- ✅ 前后端分离但统一管理（monorepo）
- ✅ 清晰的目录结构
- ✅ 统一的代码风格（ESLint、Prettier）

### 2. 环境变量管理

- ✅ 使用 `.env.example` 作为模板
- ✅ 敏感信息不提交到 Git
- ✅ 环境变量文档化

### 3. 构建优化

- ✅ 代码分割（Code Splitting）
- ✅ 资源压缩
- ✅ 缓存策略

### 4. 错误处理

- ✅ 统一的错误处理机制
- ✅ 用户友好的错误提示
- ✅ 错误日志记录

### 5. 安全性

- ✅ API Key 不暴露在前端代码
- ✅ HTTPS 强制使用
- ✅ CORS 正确配置

### 6. 监控和日志

- ✅ 集成错误监控（如 Sentry）
- ✅ 性能监控
- ✅ 日志记录

### 7. CI/CD

- ✅ 自动化测试
- ✅ 自动化部署
- ✅ 预览部署（PR 部署）

---

## 📚 相关资源

### 平台文档

- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages)

### 工具文档

- [Vite 文档](https://vitejs.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Express 文档](https://expressjs.com)

---

## 📝 部署检查清单

在每次部署前，使用此清单：

### 代码检查
- [ ] 代码已提交到 Git
- [ ] 无未提交的更改
- [ ] 代码已通过本地测试

### 配置检查
- [ ] `package.json` 配置正确
- [ ] 构建命令正确
- [ ] 环境变量清单完整

### 构建检查
- [ ] 本地构建成功
- [ ] 构建输出正确
- [ ] 无构建警告

### 部署检查
- [ ] 平台配置正确
- [ ] 环境变量已设置
- [ ] 部署日志无错误

### 验证检查
- [ ] 网站可访问
- [ ] API 正常工作
- [ ] 核心功能正常

---

**最后更新**：2024年

**适用项目类型**：
- React + Vite 前端 + Express 后端
- Next.js 全栈应用
- 其他前后端一体化项目

