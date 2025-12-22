# Vercel 部署指南

本指南将帮助你将前后端都部署到 Vercel 平台。

## 📋 部署架构

- **前端**：Vercel 静态网站托管（自动构建和部署）
- **后端**：Vercel Serverless Functions（Express API）

## 🚀 部署步骤

### 方法一：通过 Vercel Dashboard（推荐）

1. **准备项目**
   - 确保代码已推送到 Git 仓库（GitHub、GitLab 或 Bitbucket）

2. **登录 Vercel**
   - 访问 https://vercel.com
   - 使用 GitHub/GitLab 账号登录

3. **导入项目**
   - 点击 "Add New Project"
   - 选择你的 Git 仓库
   - Vercel 会自动检测项目配置

4. **配置项目设置**
   
   **Root Directory**: 留空（项目根目录）
   
   **Build Settings**:
   - **Build Command**: `npm run build`（会自动构建前后端）
   - **Output Directory**: `dist`（前端构建输出）
   - **Install Command**: `npm install && cd server && npm install`（安装前后端依赖）
   
   > **注意**：如果 `vercel.json` 已配置 `installCommand`，Vercel 会自动使用该配置，无需在 Dashboard 中设置。

5. **配置环境变量**
   
   在项目设置 → **Environment Variables** 中添加以下环境变量：
   
   **必需的环境变量**：
   ```
   CHATGLM_API_KEY=your_api_key_here
   ```
   > ⚠️ **重要**：这是唯一必需的环境变量。请从 [智谱AI开放平台](https://bigmodel.cn/usercenter/proj-mgmt/apikeys) 获取你的 API Key。
   
   **可选的环境变量**：
   ```
   CHATGLM_MODEL=glm-4.5-airx
   ```
   > 默认值已经是 `glm-4.5-airx`，通常不需要设置。
   
   **不需要设置的环境变量**：
   - ❌ `PORT` - Vercel 会自动设置，无需手动配置
   - ❌ `ALLOWED_ORIGINS` - 在 Vercel 上前后端同域，不需要 CORS 配置
   - ❌ `VITE_API_BASE_URL` - 前端会自动使用相对路径 `/api/...`，无需设置
   - ❌ `NODE_ENV` - Vercel 会自动设置为 `production`

6. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 部署成功后，你会获得一个 URL（如：`https://your-project.vercel.app`）

### 方法二：通过 Vercel CLI

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

## ⚙️ 配置说明

### vercel.json 配置

项目根目录已包含 `vercel.json` 配置文件：

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

**说明**：
- `installCommand`：自动安装前后端依赖
- `/api/*` 路由会被转发到 Express 后端（`server/api/index.ts`）
- 静态资源（`/assets/*`、`.js`、`.css` 等）直接提供
- 其他路由（SPA 路由）都指向 `index.html`
- Vercel 会自动将 Express 应用转换为 Serverless Functions

## 🔧 后端适配说明

项目已经配置好 Vercel Serverless Functions 适配：

**入口文件**：`server/api/index.ts`

```typescript
import { createApp } from '../src/index.js';

const app = createApp();

export default app;
```

这个文件将 Express 应用导出为 Vercel Serverless Function，无需额外配置。

## 📝 注意事项

1. **API 路由**
   - 后端 API 路径：`https://your-project.vercel.app/api/chat/stream`
   - 前端自动使用相对路径 `/api/...`，无需配置 `VITE_API_BASE_URL`
   - 在 Vercel 上，前后端同域，无需 CORS 配置

2. **环境变量**
   - ⚠️ **必需**：`CHATGLM_API_KEY` - 必须在 Vercel Dashboard 中配置
   - ✅ **可选**：`CHATGLM_MODEL` - 默认值为 `glm-4.5-airx`
   - ❌ **不需要**：`PORT`、`ALLOWED_ORIGINS`、`VITE_API_BASE_URL`、`NODE_ENV`
   - 敏感信息（如 API Key）必须在 Vercel Dashboard 中配置，不要将 `.env` 文件提交到 Git

3. **CORS 配置**
   - 在 Vercel 上，前后端部署在同一域名下，**不需要配置 CORS**
   - 如果遇到 CORS 错误，检查后端代码中的 CORS 中间件配置

4. **构建时间限制**
   - Vercel 免费版构建时间限制为 45 分钟
   - Hobby 计划为 45 分钟
   - Pro 计划为 60 分钟

5. **Serverless Functions 限制**
   - 执行时间限制：Hobby 10秒，Pro 60秒
   - 内存限制：1024 MB
   - 如果流式响应时间较长，可能需要升级计划

## 🔍 验证部署

部署成功后，访问：

- 前端：`https://your-project.vercel.app`
- 后端健康检查：`https://your-project.vercel.app/api/health`
- API 信息：`https://your-project.vercel.app/api/`

## 🐛 常见问题

### 问题 1：API 路由 404

**解决方案**：
- 检查 `vercel.json` 中的路由配置，确保 `/api/(.*)` 指向 `server/api/index.ts`
- 确保 `server/api/index.ts` 文件存在并正确导出 Express 应用
- 检查构建日志，确认后端构建成功

### 问题 2：环境变量未生效

**解决方案**：
- 在 Vercel Dashboard → Settings → Environment Variables 中设置
- 确保环境变量应用于 **Production**、**Preview** 和 **Development** 环境
- 设置后需要重新部署项目才能生效
- 检查环境变量名称是否正确：`CHATGLM_API_KEY`（不是 `ZHIPU_API_KEY`，虽然代码也支持）

### 问题 4：前端无法连接后端 API

**解决方案**：
- 检查浏览器控制台，确认 API 请求路径是否为相对路径 `/api/...`
- 如果显示 `localhost:8000`，说明前端仍在使用开发环境配置
- 确保没有设置 `VITE_API_BASE_URL` 环境变量（应该使用相对路径）
- 检查 Vercel 部署日志，确认前后端都构建成功

### 问题 3：流式响应超时

**解决方案**：
- 考虑升级到 Pro 计划（60秒限制）
- 或者将流式响应改为非流式

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)

