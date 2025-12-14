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
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **配置环境变量**
   
   在项目设置中添加以下环境变量：
   
   **后端环境变量**（在 Vercel Dashboard 的 Environment Variables 中设置）：
   ```
   CHATGLM_API_KEY=your_api_key_here
   CHATGLM_MODEL=glm-4.5-airx
   PORT=3000
   ALLOWED_ORIGINS=https://your-project.vercel.app
   ```
   
   **前端环境变量**（如果需要）：
   ```
   VITE_API_BASE_URL=https://your-project.vercel.app
   ```

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
  "builds": [
    {
      "src": "server/package.json",
      "use": "@vercel/node"
    },
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
      "src": "/api/(.*)",
      "dest": "server/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

**说明**：
- `/api/*` 路由会被转发到 Express 后端
- 其他路由会提供前端静态文件
- Vercel 会自动将 Express 应用转换为 Serverless Functions

## 🔧 后端适配（如果需要）

如果遇到问题，可能需要修改后端入口文件以适配 Vercel：

创建 `server/api/index.ts`（Vercel Serverless 入口）：

```typescript
import { createApp } from '../src/index.js';

const app = createApp();

export default app;
```

然后修改 `vercel.json`：

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/api/index.ts"
    }
  ]
}
```

## 📝 注意事项

1. **API 路由**
   - 后端 API 路径：`https://your-project.vercel.app/api/chat/stream`
   - 前端需要配置 API 基础 URL

2. **环境变量**
   - 敏感信息（如 API Key）必须在 Vercel Dashboard 中配置
   - 不要将 `.env` 文件提交到 Git

3. **CORS 配置**
   - 确保 `ALLOWED_ORIGINS` 包含你的 Vercel 域名
   - 格式：`https://your-project.vercel.app`

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
- 检查 `vercel.json` 中的路由配置
- 确保后端代码在 `server/src/index.ts`

### 问题 2：环境变量未生效

**解决方案**：
- 在 Vercel Dashboard 中重新设置环境变量
- 重新部署项目

### 问题 3：流式响应超时

**解决方案**：
- 考虑升级到 Pro 计划（60秒限制）
- 或者将流式响应改为非流式

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Express on Vercel](https://vercel.com/guides/using-express-with-vercel)

