# Vercel 部署问题修复说明

## 🔧 已修复的问题

### 1. 依赖安装问题
**问题**：构建后端时，`server/` 目录的依赖未安装

**修复**：
- 修改 `package.json` 中的 `build:backend` 脚本，在构建前先安装依赖：
  ```json
  "build:backend": "cd server && npm install && npm run build"
  ```
- 在 `vercel.json` 中添加 `installCommand`：
  ```json
  "installCommand": "npm install && cd server && npm install"
  ```

### 2. TypeScript 类型错误
**问题**：参数隐式具有 'any' 类型

**修复**：
- 在 `server/src/index.ts` 中添加类型注解：`Request`, `Response`
- 在 `server/src/middleware/cors.ts` 中为 CORS 回调函数添加类型注解

### 3. Vercel Serverless Functions 适配
**问题**：Express 应用需要适配 Vercel 的 Serverless Functions

**修复**：
- 创建 `server/api/index.ts` 作为 Vercel Serverless 入口
- 修改 `server/src/index.ts`，导出 `createApp` 函数
- 添加 Vercel 环境检测，避免在 Vercel 环境启动服务器

### 4. vercel.json 配置优化
**问题**：`builds` 配置可能导致构建问题

**修复**：
- 使用 `functions` 配置替代 `builds`
- 简化路由配置

## 📝 修改的文件

1. **`package.json`**
   - 修改 `build:backend` 脚本，添加依赖安装步骤

2. **`vercel.json`**
   - 添加 `installCommand` 确保安装所有依赖
   - 使用 `functions` 配置替代 `builds`
   - 更新路由配置

3. **`server/src/index.ts`**
   - 导出 `createApp` 函数供 Vercel 使用
   - 添加类型注解
   - 添加 Vercel 环境检测

4. **`server/api/index.ts`**（新建）
   - Vercel Serverless Functions 入口文件
   - 导出 Express 应用实例

5. **`server/src/middleware/cors.ts`**
   - 修复 CORS 回调函数的类型注解

## 🚀 部署步骤

1. **提交代码到 Git**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment issues"
   git push
   ```

2. **在 Vercel Dashboard 中配置环境变量**
   - `CHATGLM_API_KEY` - 你的 ChatGLM API Key
   - `CHATGLM_MODEL` - 模型名称（默认：glm-4.5-airx）
   - `ALLOWED_ORIGINS` - 允许的前端域名（如：https://your-project.vercel.app）

3. **重新部署**
   - Vercel 会自动检测到新的提交并重新部署
   - 或手动触发重新部署

## ✅ 验证部署

部署成功后，访问：
- 前端：`https://your-project.vercel.app`
- 后端健康检查：`https://your-project.vercel.app/api/health`
- API 信息：`https://your-project.vercel.app/api/`

## 🐛 如果仍有问题

1. **检查构建日志**
   - 在 Vercel Dashboard 中查看详细的构建日志
   - 确认所有依赖都已正确安装

2. **检查环境变量**
   - 确保所有必需的环境变量都已设置
   - 检查环境变量名称是否正确

3. **检查路由配置**
   - 确保 `vercel.json` 中的路由配置正确
   - API 路由应该指向 `/server/api/index.ts`

4. **本地测试**
   ```bash
   # 安装依赖
   npm install
   cd server && npm install && cd ..
   
   # 构建
   npm run build
   
   # 检查是否有错误
   ```

