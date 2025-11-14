# ChatGLM Python后端服务

这是ChatGLM API的Python后端代理服务，使用FastAPI框架实现。

## 功能特性

- ✅ 流式聊天接口（SSE格式）
- ✅ 非流式聊天接口
- ✅ 建议回复生成
- ✅ 智能体配置生成
- ✅ CORS支持（允许前端跨域访问）

## 安装和运行

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置API密钥

复制 `.env.example` 为 `.env` 并填入你的ChatGLM API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
CHATGLM_API_KEY=your_actual_api_key_here
CHATGLM_MODEL=glm-4.6
```

### 3. 运行服务

```bash
python main.py
```

或者使用uvicorn：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

服务将在 `http://localhost:8000` 启动。

## API接口

### 1. 流式聊天
- **POST** `/api/chat/stream`
- 支持SSE格式的流式响应

### 2. 非流式聊天
- **POST** `/api/chat/completions`
- 返回完整响应

### 3. 建议回复
- **POST** `/api/suggested-replies`
- 根据对话历史生成建议回复

### 4. 智能体配置
- **POST** `/api/agent-profile`
- 根据初始提示创建智能体配置

### 5. 健康检查
- **GET** `/api/health`
- 检查服务状态和API密钥配置

## 获取ChatGLM API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 在控制台获取API Key
4. 将API Key配置到 `.env` 文件中

## 注意事项

- 确保前端服务运行在 `http://localhost:3000`（或修改CORS配置）
- API密钥请妥善保管，不要提交到代码仓库
- 生产环境建议使用环境变量或密钥管理服务

