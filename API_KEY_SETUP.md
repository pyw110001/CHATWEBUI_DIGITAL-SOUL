# Gemini API Key 配置指南

## 步骤 1: 获取 Gemini API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 使用你的 Google 账号登录
3. 点击 "Create API Key" 按钮
4. 复制生成的 API Key（格式类似：`AIzaSy...`）

## 步骤 2: 配置 API Key

1. 打开项目根目录下的 `.env.local` 文件
2. 将 `GEMINI_API_KEY=YOUR_API_KEY_HERE` 中的 `YOUR_API_KEY_HERE` 替换为你的实际 API Key

**正确格式示例：**
```
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

**常见错误：**
- ❌ 不要加引号：`GEMINI_API_KEY="AIzaSy..."`
- ❌ 不要有多余空格：`GEMINI_API_KEY = AIzaSy...`
- ❌ 不要保留占位符：`GEMINI_API_KEY=YOUR_API_KEY_HERE`
- ✅ 正确格式：`GEMINI_API_KEY=AIzaSy...`（等号前后可以有空格，但 key 本身不要有空格）

## 步骤 3: 重启开发服务器

修改 `.env.local` 后，必须重启开发服务器：

1. 在终端中按 `Ctrl + C` 停止当前服务器
2. 运行 `npm run dev` 重新启动
3. 刷新浏览器页面（`Ctrl + Shift + R`）

## 步骤 4: 验证配置

打开浏览器开发者工具（F12），查看 Console 标签页：

- ✅ 如果看到 `Gemini API Key loaded: AIzaSy... (length: 39)` 说明配置成功
- ❌ 如果看到 `⚠️ 请将 .env.local 文件中的 YOUR_API_KEY_HERE 替换为你的实际 Gemini API Key!` 说明还没有替换占位符
- ❌ 如果看到 `API_KEY or GEMINI_API_KEY environment variable not set` 说明环境变量没有加载

## 故障排除

### 问题：API key not valid

**可能原因：**
1. API Key 复制不完整（应该大约 39 个字符）
2. API Key 前后有空格或特殊字符
3. 使用了错误的 API Key（不是 Gemini 的 API Key）

**解决方法：**
1. 重新从 Google AI Studio 复制 API Key
2. 检查 `.env.local` 文件，确保格式正确
3. 重启开发服务器
4. 清除浏览器缓存后重试

### 问题：环境变量没有加载

**解决方法：**
1. 确保文件名为 `.env.local`（不是 `.env` 或其他名称）
2. 确保文件在项目根目录（与 `package.json` 同级）
3. 重启开发服务器
4. 检查 `vite.config.ts` 中的配置是否正确

## 安全提示

⚠️ **重要：** `.env.local` 文件包含敏感信息，不要提交到 Git 仓库。该文件已在 `.gitignore` 中，确保不会被意外提交。

