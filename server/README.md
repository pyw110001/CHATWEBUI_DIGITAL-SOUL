# 后端服务

TypeScript/Express后端服务，提供ChatGLM API代理功能。

## 快速开始

### 安装依赖
```bash
npm install
```

### 配置环境变量
复制 `.env.example` 为 `.env` 并填入API密钥：
```bash
cp .env.example .env
```

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm run build
npm start
```

## API接口

- `GET /` - API信息
- `GET /api/health` - 健康检查
- `POST /api/chat/stream` - 流式聊天
- `POST /api/chat/completions` - 非流式聊天
- `POST /api/suggested-replies` - 建议回复
- `POST /api/agent-profile` - 智能体配置

## 环境变量

- `CHATGLM_API_KEY` - ChatGLM API密钥（必需）
- `CHATGLM_MODEL` - 模型名称（默认：glm-4.5-airx）
- `PORT` - 服务端口（默认：8000）
- `ALLOWED_ORIGINS` - CORS允许的源

