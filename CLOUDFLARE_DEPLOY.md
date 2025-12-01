# Cloudflare 快速部署指南

## 📋 部署前准备

### 1. 确保前端已构建
```bash
npm run build
```
确认 `dist` 目录已生成所有文件。

### 2. 准备后端部署

后端需要部署到支持 Python 的平台，推荐使用 **Railway**（最简单）。

---

## 🚀 快速部署步骤

### 步骤 1：部署前端到 Cloudflare Pages

#### 方法 A：通过 Dashboard（最简单）

1. 访问 https://dash.cloudflare.com → Pages
2. 点击 "Create a project" → "Upload assets"
3. 上传 `dist` 目录中的所有文件
4. 项目名称：`your-project-name`
5. 点击 "Deploy site"

#### 方法 B：通过 Wrangler CLI

```bash
# 安装 Wrangler（如果还没有）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist --project-name=your-project-name
```

#### 方法 C：通过 Git（推荐用于持续部署）

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Pages 中连接仓库
3. 配置：
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Framework preset: `Vite`

### 步骤 2：部署后端到 Railway

1. **注册 Railway**
   - 访问 https://railway.app
   - 使用 GitHub 登录

2. **创建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **配置服务**
   - Railway 会自动检测到 `backend` 目录
   - 如果没有，手动设置：
     - Root Directory: `backend`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **设置环境变量**
   - 在 Railway 项目设置中添加：
     ```
     CHATGLM_API_KEY=你的API密钥
     CHATGLM_MODEL=glm-4.5-airx
     ALLOWED_ORIGINS=https://your-frontend.pages.dev
     ```

5. **获取后端 URL**
   - Railway 会自动生成一个 URL
   - 例如：`https://your-app.railway.app`
   - 复制这个 URL

### 步骤 3：配置前端环境变量

1. 在 Cloudflare Pages 项目设置中
2. 进入 "Settings" → "Environment variables"
3. 添加：
   ```
   VITE_API_BASE_URL=https://your-app.railway.app
   ```
4. 保存并重新部署

---

## ✅ 验证部署

### 检查后端
访问：`https://your-backend-url/api/health`

应该返回：
```json
{
  "status": "ok",
  "api_key_configured": true,
  "model": "glm-4.5-airx"
}
```

### 检查前端
1. 访问你的 Cloudflare Pages URL
2. 打开浏览器开发者工具（F12）
3. 查看 Network 标签
4. 尝试发送一条消息
5. 确认请求能成功发送到后端

---

## 🔧 常见问题

### 问题 1：前端无法连接后端

**解决方案：**
1. 检查 `VITE_API_BASE_URL` 环境变量是否正确设置
2. 检查后端 CORS 配置是否包含前端域名
3. 检查后端服务是否正常运行

### 问题 2：CORS 错误

**解决方案：**
在后端环境变量中添加：
```
ALLOWED_ORIGINS=https://your-frontend.pages.dev
```

或者后端已经配置了自动允许所有 `*.pages.dev` 域名。

### 问题 3：API Key 未配置

**解决方案：**
1. 检查 Railway 环境变量 `CHATGLM_API_KEY` 是否设置
2. 检查 API Key 是否正确（无多余空格）
3. 查看 Railway 日志确认

---

## 📝 部署检查清单

- [ ] 前端已构建（`npm run build`）
- [ ] 后端已部署到 Railway/Render
- [ ] 后端环境变量已设置（`CHATGLM_API_KEY`）
- [ ] 前端环境变量已设置（`VITE_API_BASE_URL`）
- [ ] 后端 CORS 已配置
- [ ] 测试后端健康检查接口
- [ ] 测试前端完整功能

---

## 🎯 下一步

部署完成后，你可以：
1. 配置自定义域名（Cloudflare Pages 支持）
2. 启用 Cloudflare CDN 加速
3. 配置缓存策略优化性能
4. 设置监控和日志

---

## 📚 详细文档

更多详细信息请参考 `DEPLOYMENT.md` 文件。

