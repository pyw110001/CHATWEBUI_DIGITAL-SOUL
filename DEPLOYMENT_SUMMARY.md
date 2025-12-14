# 部署方案总结

## ✅ 可以部署的平台

你的项目现在完全由 JavaScript/TypeScript 实现，可以部署到以下平台：

### 🚀 Vercel（推荐用于快速部署）

**优势**：
- ✅ 免费套餐足够使用
- ✅ 自动 HTTPS 和 CDN
- ✅ 自动 CI/CD（Git 推送自动部署）
- ✅ 支持 Serverless Functions（Express 自动转换）
- ✅ 全球边缘网络，访问速度快

**适用场景**：
- 个人项目或小型项目
- 需要快速部署和迭代
- 流量不是特别大

**部署文档**：查看 [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

---

### ☁️ Google Cloud Platform

**优势**：
- ✅ 强大的基础设施
- ✅ 灵活的部署选项（Cloud Run、App Engine、Compute Engine）
- ✅ 按使用量计费，成本可控
- ✅ 支持容器化部署

**适用场景**：
- 企业级应用
- 需要更多控制权
- 需要与其他 Google Cloud 服务集成

**部署文档**：查看 [GOOGLE_CLOUD_DEPLOY.md](./GOOGLE_CLOUD_DEPLOY.md)

---

## 📋 部署前准备

### 1. 环境变量配置

**后端环境变量**（在部署平台设置）：
```env
CHATGLM_API_KEY=your_api_key_here
CHATGLM_MODEL=glm-4.5-airx
PORT=8080  # Vercel/Cloud Run 会自动设置
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

**前端环境变量**（如果需要）：
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

### 2. 代码检查

✅ 后端已支持 `PORT` 环境变量（适配 Vercel 和 Cloud Run）
✅ 已创建 `vercel.json` 配置文件
✅ 已创建 `Dockerfile`（用于 Google Cloud）
✅ 已创建 `app.yaml`（用于 App Engine）

### 3. 前端 API 配置

确保前端服务中的 API 基础 URL 指向部署后的后端地址：

```typescript
// services/chatglmService.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

---

## 🚀 快速部署步骤

### Vercel 部署（最简单）

1. 将代码推送到 GitHub/GitLab
2. 访问 https://vercel.com 并登录
3. 点击 "Add New Project"
4. 选择你的仓库
5. 配置环境变量
6. 点击 "Deploy"
7. 完成！

### Google Cloud 部署

1. 安装 Google Cloud SDK
2. 运行 `gcloud init` 初始化
3. 构建 Docker 镜像：`gcloud builds submit --tag gcr.io/PROJECT_ID/chatglm-api`
4. 部署到 Cloud Run：`gcloud run deploy chatglm-api --image gcr.io/PROJECT_ID/chatglm-api`
5. 配置环境变量和 CORS
6. 完成！

---

## 📊 平台对比

| 特性 | Vercel | Google Cloud Run | Google App Engine |
|------|--------|------------------|-------------------|
| 免费额度 | ✅ 有 | ✅ 有 | ✅ 有 |
| 部署难度 | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐ 中等 |
| 自动 HTTPS | ✅ | ✅ | ✅ |
| CDN | ✅ | ✅ | ✅ |
| 流式响应支持 | ⚠️ 有限制 | ✅ | ✅ |
| 成本 | 💰 低 | 💰 按使用量 | 💰 按使用量 |
| 扩展性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## ⚠️ 注意事项

### 流式响应

- **Vercel**：Serverless Functions 有执行时间限制（Hobby 10秒，Pro 60秒）
- **Google Cloud Run**：支持长时间流式响应（默认 300 秒）

如果流式响应时间较长，建议使用 Google Cloud Run。

### CORS 配置

部署后，确保 `ALLOWED_ORIGINS` 环境变量包含前端域名：

```env
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.com
```

### API Key 安全

- ✅ 使用平台的环境变量功能（不要硬编码）
- ✅ Vercel：在 Dashboard 中设置
- ✅ Google Cloud：使用 Secret Manager

---

## 🔍 验证部署

部署成功后，访问以下 URL 验证：

- 前端：`https://your-frontend-domain.com`
- 后端健康检查：`https://your-backend-domain.com/api/health`
- API 信息：`https://your-backend-domain.com/`

---

## 📚 详细文档

- [Vercel 部署指南](./VERCEL_DEPLOY.md)
- [Google Cloud 部署指南](./GOOGLE_CLOUD_DEPLOY.md)
- [Cloudflare 部署指南](./CLOUDFLARE_DEPLOY.md)（仅前端）

---

## 💡 推荐方案

**个人项目/快速部署**：使用 **Vercel**
- 最简单快速
- 免费套餐足够使用
- 自动 CI/CD

**企业项目/需要更多控制**：使用 **Google Cloud Run**
- 更灵活
- 支持长时间流式响应
- 更好的扩展性

