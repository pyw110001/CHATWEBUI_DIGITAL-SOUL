# 快速启动指南

## 前置要求

- Python 3.8+
- Node.js 16+
- ChatGLM API密钥（从 [智谱AI开放平台](https://open.bigmodel.cn/) 获取）

## 快速开始

### 1. 设置Python后端

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 创建环境变量文件
# Windows (PowerShell)
echo "CHATGLM_API_KEY=your_api_key_here" > .env
echo "CHATGLM_MODEL=glm-4.6" >> .env

# Linux/Mac
cat > .env << EOF
CHATGLM_API_KEY=your_api_key_here
CHATGLM_MODEL=glm-4.6
EOF

# 编辑 .env 文件，填入你的实际API密钥
# 然后启动后端
python main.py
```

后端将在 `http://localhost:8000` 启动。

### 2. 启动前端

```bash
# 在项目根目录
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动。

### 3. 访问应用

打开浏览器访问 `http://localhost:3000`

## 验证安装

### 检查后端是否正常运行

访问 `http://localhost:8000/api/health`，应该看到：

```json
{
  "status": "ok",
  "api_key_configured": true,
  "model": "glm-4.6"
}
```

### 检查前端连接

打开浏览器开发者工具（F12），查看控制台是否有错误。如果看到 "API错误" 或连接失败，请检查：

1. 后端服务是否正在运行
2. API密钥是否正确配置
3. CORS配置是否正确

## 常见问题

### 后端启动失败

**错误：** `ModuleNotFoundError`

**解决：**
```bash
pip install -r requirements.txt
```

### API密钥错误

**错误：** `ChatGLM API Key未配置`

**解决：**
1. 检查 `backend/.env` 文件是否存在
2. 确认 `CHATGLM_API_KEY` 已正确设置（没有多余的空格）
3. 重启后端服务

### 前端无法连接后端

**错误：** `Failed to fetch` 或 CORS 错误

**解决：**
1. 确认后端运行在 `http://localhost:8000`
2. 检查浏览器控制台的错误信息
3. 如果使用不同端口，修改 `backend/main.py` 中的 CORS 配置

## 下一步

- 查看 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) 了解详细的迁移说明
- 查看 [backend/README.md](./backend/README.md) 了解后端API详情
