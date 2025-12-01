# Cloudflare 部署指南

本指南将帮助你将项目部署到 Cloudflare Pages（前端）和推荐的后端托管服务。

## 部署架构

- **前端**：Cloudflare Pages（静态网站托管）
- **后端**：推荐使用 Railway、Render 或 Fly.io（Python FastAPI 服务）

---

## 第一部分：前端部署到 Cloudflare Pages

### 方法一：通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 登录你的账户

2. **创建新项目**
   - 进入 "Pages" 部分
   - 点击 "Create a project"
   - 选择 "Connect to Git"（如果使用 Git）或 "Upload assets"（直接上传）

3. **如果使用 Git**
   - 连接你的 Git 仓库（GitHub、GitLab 等）
   - 配置构建设置：
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Root directory**: `/`（项目根目录）
     - **Framework preset**: Vite

4. **如果直接上传**
   - 选择 "Upload assets"
   - 上传 `dist` 目录中的所有文件

5. **配置环境变量**
   - 在项目设置中添加环境变量：
     - `VITE_API_BASE_URL`: 你的后端 API 地址（例如：`https://your-backend.railway.app`）

6. **部署**
   - 点击 "Deploy site"
   - 等待构建完成

### 方法二：通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=your-project-name
```

---

## 第二部分：后端部署

Cloudflare 不支持直接运行 Python FastAPI 应用，需要部署到其他平台。

### 选项 1：Railway（推荐）

1. **注册 Railway**
   - 访问 https://railway.app
   - 使用 GitHub 登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo" 或 "Empty Project"

3. **配置项目**
   - 如果从 GitHub 部署：
     - 选择你的仓库
     - Railway 会自动检测 Python 项目
   - 如果手动部署：
     - 添加 "Python" 服务
     - 设置工作目录为 `backend`

4. **配置环境变量**
   - 在项目设置中添加：
     - `CHATGLM_API_KEY`: 你的 ChatGLM API Key
     - `CHATGLM_MODEL`: `glm-4.5-airx`（可选）

5. **配置启动命令**
   - 在 Railway 设置中，添加启动命令：
     ```
     cd backend && python main.py
     ```
   或者使用 uvicorn：
     ```
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

6. **获取部署 URL**
   - Railway 会自动生成一个 URL（例如：`https://your-app.railway.app`）
   - 记下这个 URL，用于前端配置

### 选项 2：Render

1. **注册 Render**
   - 访问 https://render.com
   - 使用 GitHub 登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库

3. **配置服务**
   - **Name**: 你的服务名称
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py` 或 `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **配置环境变量**
   - 添加 `CHATGLM_API_KEY` 和 `CHATGLM_MODEL`

5. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成

### 选项 3：Fly.io

1. **安装 Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **登录 Fly.io**
   ```bash
   fly auth login
   ```

3. **在 backend 目录创建 fly.toml**
   ```toml
   app = "your-app-name"
   primary_region = "sin"  # 选择离你最近的区域

   [build]

   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

4. **创建 Dockerfile**（在 backend 目录）
   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

5. **部署**
   ```bash
   cd backend
   fly deploy
   ```

---

## 第三部分：配置 CORS

确保后端允许 Cloudflare Pages 域名访问：

### 更新 backend/main.py

```python
# 在 main.py 中更新 CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-frontend.pages.dev",  # 你的 Cloudflare Pages 域名
        "https://*.pages.dev",  # 允许所有 Cloudflare Pages 域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 第四部分：环境变量配置

### 前端环境变量（Cloudflare Pages）

在 Cloudflare Pages 项目设置中添加：

- `VITE_API_BASE_URL`: 你的后端 API 地址
  - 例如：`https://your-backend.railway.app`
  - 或：`https://your-app.onrender.com`

### 后端环境变量（Railway/Render/Fly.io）

- `CHATGLM_API_KEY`: 你的 ChatGLM API Key
- `CHATGLM_MODEL`: `glm-4.5-airx`（可选，默认值）

---

## 第五部分：验证部署

1. **检查前端**
   - 访问你的 Cloudflare Pages URL
   - 打开浏览器开发者工具
   - 检查网络请求，确认能正确连接到后端

2. **检查后端**
   - 访问 `https://your-backend-url/api/health`
   - 应该返回：
     ```json
     {
       "status": "ok",
       "api_key_configured": true,
       "model": "glm-4.5-airx"
     }
     ```

3. **测试完整流程**
   - 在前端登录
   - 选择一个智能体
   - 发送一条消息
   - 确认能收到回复

---

## 故障排除

### 前端无法连接后端

1. 检查 `VITE_API_BASE_URL` 环境变量是否正确
2. 检查后端 CORS 配置是否包含前端域名
3. 检查后端服务是否正常运行

### 后端 API Key 未配置

1. 检查后端环境变量 `CHATGLM_API_KEY` 是否设置
2. 检查 `.env` 文件是否存在于后端目录
3. 查看后端日志确认 API Key 是否正确加载

### 构建失败

1. 检查 Node.js 版本（推荐 18+）
2. 检查依赖是否正确安装
3. 查看构建日志中的错误信息

---

## 注意事项

1. **API Key 安全**
   - 不要将 API Key 提交到 Git 仓库
   - 使用环境变量管理敏感信息

2. **成本考虑**
   - Cloudflare Pages 免费版有使用限制
   - Railway/Render 免费版有资源限制
   - 生产环境建议使用付费计划

3. **性能优化**
   - 启用 Cloudflare CDN 加速
   - 配置缓存策略
   - 优化图片资源大小

---

## 快速部署检查清单

- [ ] 前端已构建到 `dist` 目录
- [ ] 后端已部署到 Railway/Render/Fly.io
- [ ] 后端 CORS 已配置允许前端域名
- [ ] 前端环境变量 `VITE_API_BASE_URL` 已设置
- [ ] 后端环境变量 `CHATGLM_API_KEY` 已设置
- [ ] 测试前端和后端连接
- [ ] 测试完整聊天流程

---

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Railway 文档](https://docs.railway.app/)
- [Render 文档](https://render.com/docs)
- [Fly.io 文档](https://fly.io/docs/)

