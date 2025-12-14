# AI智能体聊天系统

基于 React + TypeScript + Express 的智能对话系统，支持多智能体对话和流式响应。

## 🚀 快速开始

### 一键启动

```bash
npm run dev
```

这将同时启动：
- 前端开发服务器：`http://localhost:3000`
- 后端API服务：`http://localhost:8000`

### 首次使用

1. **安装依赖**
   ```bash
   # 安装前端依赖
   npm install
   
   # 安装后端依赖
   cd server
   npm install
   cd ..
   ```

2. **配置API密钥**
   - 在 `server/` 目录下创建 `.env` 文件
   - 填入你的 ChatGLM API Key：
     ```env
     CHATGLM_API_KEY=your_api_key_here
     CHATGLM_MODEL=glm-4.5-airx
     ```
   - 详细配置说明请查看 [API_KEY_CONFIG.md](./API_KEY_CONFIG.md)

3. **启动项目**
   ```bash
   npm run dev
   ```

## 📁 项目结构

```
.
├── server/              # 后端服务 (TypeScript/Express)
│   ├── src/            # 源代码
│   │   ├── api/        # API调用
│   │   ├── config/     # 配置
│   │   ├── middleware/ # 中间件
│   │   ├── routes/     # 路由
│   │   ├── types/      # 类型定义
│   │   └── utils/      # 工具函数
│   ├── .env            # 环境变量（需要创建）
│   └── package.json
├── components/          # React组件
├── services/           # 前端服务
├── assets/             # 静态资源
└── package.json         # 前端依赖和统一启动脚本
```

## 🛠️ 可用命令

### 统一启动（推荐）
- `npm run dev` - 同时启动前后端开发服务器
- `npm start` - 同时启动前后端生产服务器
- `npm run build` - 构建前后端

### 单独启动
- `npm run dev:frontend` - 仅启动前端
- `npm run dev:backend` - 仅启动后端
- `npm run build:frontend` - 仅构建前端
- `npm run build:backend` - 仅构建后端

## 📚 文档

- [快速启动指南](./START.md) - 详细的启动说明
- [API Key配置](./API_KEY_CONFIG.md) - API密钥配置指南
- [功能说明](./FEATURES.md) - 项目功能列表
- [部署指南](./DEPLOYMENT.md) - 部署到生产环境
- [Cloudflare部署](./CLOUDFLARE_DEPLOY.md) - Cloudflare Pages部署

## 🔧 技术栈

### 前端
- React 19
- TypeScript
- Vite
- Framer Motion

### 后端
- Node.js
- Express
- TypeScript
- Axios

### API
- ChatGLM API (智谱AI)

## 📝 环境变量

后端环境变量（`server/.env`）：
```env
CHATGLM_API_KEY=your_api_key_here
CHATGLM_MODEL=glm-4.5-airx
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## ✅ 验证

启动后访问：
- 前端：http://localhost:3000
- 后端健康检查：http://localhost:8000/api/health
- 后端API信息：http://localhost:8000/

## 📄 许可证

MIT
