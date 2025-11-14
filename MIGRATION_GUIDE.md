# 从Gemini API迁移到ChatGLM API指南

本文档说明如何将项目从使用Gemini API迁移到使用ChatGLM API（通过Python后端）。

## 架构变化

### 之前（直接调用Gemini API）
```
前端 (React) → @google/genai → Gemini API
```

### 现在（通过Python后端）
```
前端 (React) → Python后端 (FastAPI) → ChatGLM API
```

## 迁移步骤

### 1. 设置Python后端

#### 1.1 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 1.2 配置API密钥

在 `backend` 目录下创建 `.env` 文件：

```env
CHATGLM_API_KEY=your_chatglm_api_key_here
CHATGLM_MODEL=glm-4.6
```

**获取ChatGLM API密钥：**
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 在控制台获取API Key
4. 将API Key配置到 `.env` 文件中

#### 1.3 启动后端服务

```bash
cd backend
python main.py
```

或者使用uvicorn：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 `http://localhost:8000` 启动。

### 2. 配置前端

#### 2.1 设置API基础URL（可选）

如果需要修改后端地址，可以在项目根目录创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:8000
```

默认情况下，前端会使用 `http://localhost:8000`。

#### 2.2 启动前端

```bash
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动。

## 代码变化

### 服务层变化

**之前 (`services/geminiService.ts`):**
- 直接使用 `@google/genai` 客户端
- 在浏览器端直接调用Gemini API

**现在 (`services/chatglmService.ts`):**
- 通过HTTP请求调用Python后端
- 后端负责与ChatGLM API通信

### 主要接口保持不变

为了保持兼容性，新的 `chatglmService.ts` 提供了相同的接口：

- `startChatSession(systemPrompt: string)` - 创建聊天会话
- `streamMessage(session, message)` - 流式发送消息
- `getSuggestedReplies(history)` - 获取建议回复
- `createAgentProfile(initialPrompt)` - 创建智能体配置

## API接口说明

### Python后端API

#### 1. 流式聊天
- **POST** `/api/chat/stream`
- 支持SSE格式的流式响应
- 请求体：
```json
{
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "system_prompt": "你是一个助手",
  "stream": true
}
```

#### 2. 建议回复
- **POST** `/api/suggested-replies`
- 根据对话历史生成建议回复

#### 3. 智能体配置
- **POST** `/api/agent-profile`
- 根据初始提示创建智能体配置

#### 4. 健康检查
- **GET** `/api/health`
- 检查服务状态和API密钥配置

## 流式输出实现

ChatGLM API使用SSE（Server-Sent Events）格式进行流式输出，格式如下：

```
data: {"text": "你好"}
data: {"text": "，"}
data: {"text": "有什么"}
...
data: {"done": true}
```

前端通过 `fetch` API的 `ReadableStream` 处理流式响应。

## 故障排查

### 1. 后端无法启动

**问题：** `ModuleNotFoundError: No module named 'fastapi'`

**解决：** 确保已安装所有依赖：
```bash
pip install -r requirements.txt
```

### 2. API密钥错误

**问题：** 后端返回 `ChatGLM API Key未配置`

**解决：** 
- 检查 `backend/.env` 文件是否存在
- 确认 `CHATGLM_API_KEY` 已正确设置
- 重启后端服务

### 3. CORS错误

**问题：** 前端无法访问后端API

**解决：** 
- 检查后端CORS配置（`backend/main.py`）
- 确认前端运行在 `http://localhost:3000`
- 如需修改端口，更新后端的 `allow_origins` 配置

### 4. 流式输出不工作

**问题：** 消息无法流式显示

**解决：**
- 检查浏览器控制台是否有错误
- 确认后端服务正常运行
- 检查网络连接

## 环境变量说明

### 后端环境变量（`backend/.env`）

- `CHATGLM_API_KEY`: ChatGLM API密钥（必需）
- `CHATGLM_MODEL`: 使用的模型，默认为 `glm-4.6`
- `ZHIPU_API_KEY`: 兼容旧版本，等同于 `CHATGLM_API_KEY`

### 前端环境变量（`.env.local`）

- `VITE_API_BASE_URL`: 后端API地址，默认为 `http://localhost:8000`

## 生产环境部署

### 后端部署

1. 使用进程管理器（如PM2、supervisor）管理Python进程
2. 使用Nginx作为反向代理
3. 配置HTTPS
4. 使用环境变量管理API密钥（不要硬编码）

### 前端部署

1. 构建生产版本：`npm run build`
2. 部署到静态文件服务器（如Nginx、Vercel、Netlify）
3. 配置 `VITE_API_BASE_URL` 指向生产环境的后端地址

## 注意事项

1. **API密钥安全**：不要将API密钥提交到代码仓库，使用 `.env` 文件或环境变量
2. **CORS配置**：生产环境需要正确配置CORS，只允许信任的域名访问
3. **错误处理**：确保前后端都有适当的错误处理机制
4. **超时设置**：根据实际需求调整API调用的超时时间

## 参考文档

- [ChatGLM流式消息文档](https://docs.bigmodel.cn/cn/guide/capabilities/streaming)
- [智谱AI开放平台](https://open.bigmodel.cn/)
- [FastAPI文档](https://fastapi.tiangolo.com/)

