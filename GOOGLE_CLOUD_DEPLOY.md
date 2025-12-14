# Google Cloud 部署指南

本指南将帮助你将项目部署到 Google Cloud Platform。

## 📋 部署架构选项

### 方案一：Cloud Run（推荐）
- **前端**：Cloud Storage + Cloud CDN（静态网站）
- **后端**：Cloud Run（容器化 Express 服务）

### 方案二：App Engine
- **前端**：App Engine 静态文件服务
- **后端**：App Engine Node.js 运行时

### 方案三：Compute Engine
- **前端 + 后端**：在同一 VM 实例上运行

## 🚀 方案一：Cloud Run 部署（推荐）

### 前置要求

1. 安装 Google Cloud SDK：
```bash
# Windows (使用 Chocolatey)
choco install gcloudsdk

# 或下载安装包
# https://cloud.google.com/sdk/docs/install
```

2. 初始化 gcloud：
```bash
gcloud init
gcloud auth login
```

3. 创建项目（如果还没有）：
```bash
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
```

### 步骤 1：部署后端到 Cloud Run

1. **创建 Dockerfile**

在 `server/` 目录下创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/index.js"]
```

2. **创建 .dockerignore**

在 `server/` 目录下创建 `.dockerignore`：

```
node_modules
dist
*.log
.env
.git
```

3. **构建和部署**

```bash
cd server

# 构建 Docker 镜像
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chatglm-api

# 部署到 Cloud Run
gcloud run deploy chatglm-api \
  --image gcr.io/YOUR_PROJECT_ID/chatglm-api \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars CHATGLM_API_KEY=your_api_key_here,CHATGLM_MODEL=glm-4.5-airx \
  --set-env-vars PORT=8080 \
  --set-env-vars ALLOWED_ORIGINS=https://your-frontend-domain.com
```

4. **获取后端 URL**

部署成功后，你会获得一个 URL：
```
https://chatglm-api-xxxxx-xx.a.run.app
```

### 步骤 2：部署前端到 Cloud Storage

1. **构建前端**

```bash
# 在项目根目录
npm run build:frontend
```

2. **创建存储桶**

```bash
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l asia-east1 gs://YOUR_BUCKET_NAME
```

3. **配置为网站**

```bash
gsutil web set -m index.html -e index.html gs://YOUR_BUCKET_NAME
```

4. **上传文件**

```bash
gsutil -m cp -r dist/* gs://YOUR_BUCKET_NAME/
```

5. **设置公共访问**

```bash
gsutil iam ch allUsers:objectViewer gs://YOUR_BUCKET_NAME
```

6. **配置 Cloud CDN（可选）**

```bash
# 创建后端服务
gcloud compute backend-buckets create YOUR_BUCKET_NAME-backend \
  --gcs-bucket-name=YOUR_BUCKET_NAME

# 创建 URL 映射
gcloud compute url-maps create YOUR_BUCKET_NAME-map \
  --default-backend-bucket=YOUR_BUCKET_NAME-backend

# 创建 HTTPS 代理
gcloud compute target-https-proxies create YOUR_BUCKET_NAME-https-proxy \
  --url-map=YOUR_BUCKET_NAME-map \
  --ssl-certificates=YOUR_SSL_CERT

# 创建全局转发规则
gcloud compute forwarding-rules create YOUR_BUCKET_NAME-forwarding-rule \
  --global \
  --target-https-proxy=YOUR_BUCKET_NAME-https-proxy \
  --ports=443
```

### 步骤 3：更新前端 API 配置

在前端代码中，更新 API 基础 URL 为 Cloud Run 后端地址。

## 🚀 方案二：App Engine 部署

### 后端部署

1. **创建 app.yaml**

在 `server/` 目录下创建 `app.yaml`：

```yaml
runtime: nodejs20

env_variables:
  CHATGLM_API_KEY: your_api_key_here
  CHATGLM_MODEL: glm-4.5-airx
  PORT: 8080
  ALLOWED_ORIGINS: https://YOUR_PROJECT_ID.appspot.com

automatic_scaling:
  min_instances: 0
  max_instances: 10
```

2. **部署**

```bash
cd server
gcloud app deploy
```

### 前端部署

1. **创建 app.yaml**

在项目根目录创建 `app.yaml`：

```yaml
runtime: nodejs20

handlers:
  - url: /api/.*
    script: auto
  - url: /(.*)
    static_files: dist/\1
    upload: dist/(.*)
```

2. **部署**

```bash
gcloud app deploy
```

## 🔧 环境变量配置

### 使用 Secret Manager（推荐）

1. **创建 Secret**

```bash
echo -n "your_api_key_here" | gcloud secrets create chatglm-api-key --data-file=-
```

2. **在 Cloud Run 中使用**

```bash
gcloud run deploy chatglm-api \
  --update-secrets CHATGLM_API_KEY=chatglm-api-key:latest \
  --region asia-east1
```

### 使用环境变量文件

在 `server/.env.production` 中配置（不要提交到 Git）：

```env
CHATGLM_API_KEY=your_api_key_here
CHATGLM_MODEL=glm-4.5-airx
PORT=8080
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## 📝 注意事项

1. **CORS 配置**
   - 确保 `ALLOWED_ORIGINS` 包含前端域名
   - Cloud Run 默认允许所有源，但建议明确配置

2. **端口配置**
   - Cloud Run 使用 `PORT` 环境变量（默认 8080）
   - 需要修改后端代码以使用 `process.env.PORT`

3. **流式响应**
   - Cloud Run 支持流式响应
   - 注意超时限制（默认 300 秒）

4. **成本优化**
   - Cloud Run 按使用量计费
   - 设置最小实例数为 0 以节省成本
   - 使用 Cloud Storage 存储静态文件更便宜

## 🔍 验证部署

部署成功后，访问：

- 前端：`https://YOUR_BUCKET_NAME.storage.googleapis.com` 或自定义域名
- 后端：`https://chatglm-api-xxxxx-xx.a.run.app/api/health`

## 🐛 常见问题

### 问题 1：端口错误

**解决方案**：
修改 `server/src/config/index.ts`，使用 `process.env.PORT`：

```typescript
port: parseInt(process.env.PORT || '8000', 10),
```

### 问题 2：CORS 错误

**解决方案**：
在 Cloud Run 部署时设置正确的 `ALLOWED_ORIGINS` 环境变量。

### 问题 3：构建失败

**解决方案**：
- 检查 Dockerfile 是否正确
- 确保所有依赖都在 `package.json` 中
- 查看 Cloud Build 日志

## 📚 相关资源

- [Cloud Run 文档](https://cloud.google.com/run/docs)
- [Cloud Storage 文档](https://cloud.google.com/storage/docs)
- [App Engine 文档](https://cloud.google.com/appengine/docs)

