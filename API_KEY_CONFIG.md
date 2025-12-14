# API Key 配置说明

## 📍 API Key 存放位置

**API Key 应该放在：`server/.env` 文件**

## 配置步骤

### 1. 创建 .env 文件

在 `server/` 目录下创建 `.env` 文件：

```bash
cd server
cp .env.example .env
```

### 2. 编辑 .env 文件

打开 `server/.env` 文件，填入你的API Key：

```env
CHATGLM_API_KEY=your_actual_api_key_here
CHATGLM_MODEL=glm-4.5-airx
```

### 3. 获取 API Key

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 登录你的账号
3. 进入 [API Keys 管理页面](https://bigmodel.cn/usercenter/proj-mgmt/apikeys)
4. 创建或复制你的 API Key

## 文件位置说明

```
项目根目录/
├── server/
│   ├── .env          ← API Key 放在这里 ✅
│   ├── .env.example  ← 配置模板
│   └── src/
│       └── config/
│           └── index.ts  ← 从这里读取 .env
```

## 配置格式

`.env` 文件格式：

```env
# ChatGLM API配置（必需）
CHATGLM_API_KEY=7141e2ec5ccf4dbdad9070d3b3e510f8.6ok4a03jivxVpPJq

# 模型配置（可选，默认glm-4.5-airx）
CHATGLM_MODEL=glm-4.5-airx

# CORS配置（可选）
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 服务器配置（可选）
HOST=0.0.0.0
PORT=8000
```

## 注意事项

1. ✅ `.env` 文件在 `.gitignore` 中，不会被提交到Git
2. ✅ 不要将 `.env` 文件提交到代码仓库
3. ✅ API Key 前后不要有空格
4. ✅ 不要加引号：`CHATGLM_API_KEY="key"` ❌
5. ✅ 正确格式：`CHATGLM_API_KEY=key` ✅

## 验证配置

启动服务后，访问 `http://localhost:8000/api/health` 检查：
- `api_key_configured: true` 表示配置成功
- `api_key_configured: false` 表示未配置

## 快速创建

如果之前有 `backend/.env` 文件，可以复制：

```bash
# Windows PowerShell
Copy-Item backend\.env server\.env

# 或者手动创建
# 在 server/ 目录下创建 .env 文件，填入你的 API Key
```

