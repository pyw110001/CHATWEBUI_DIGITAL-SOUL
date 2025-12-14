/**
 * 配置模块
 * 处理环境变量和配置
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// server目录路径（config/index.ts 在 server/src/config/，所以需要回到server目录）
const serverDir = join(__dirname, '../..');

/**
 * 加载环境变量
 * 处理BOM字符（与Python版本保持一致）
 */
function loadEnv(): void {
  // .env文件放在server目录下
  const envPath = join(serverDir, '.env');
  
  // 如果.env文件存在，处理BOM字符
  if (existsSync(envPath)) {
    try {
      // 使用utf-8-sig编码读取（自动去除BOM）
      const content = readFileSync(envPath, 'utf-8');
      // 重新写入为utf-8（去除BOM）
      writeFileSync(envPath, content, 'utf-8');
    } catch (error) {
      console.warn('处理.env文件BOM时出错:', error);
    }
  }
  
  // 加载环境变量
  dotenv.config({ path: envPath });
}

// 加载环境变量
loadEnv();

/**
 * 从环境变量读取API Key，去除前后空格
 */
function getApiKey(): string | null {
  const apiKey = process.env.CHATGLM_API_KEY || process.env.ZHIPU_API_KEY;
  if (apiKey) {
    const trimmed = apiKey.trim();
    // 调试信息（仅开发环境）
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] API Key loaded, length: ${trimmed.length}, prefix: ${trimmed.substring(0, 10)}...`);
    }
    return trimmed;
  }
  return null;
}

/**
 * 获取允许的源列表
 */
function getAllowedOrigins(): string[] {
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 
    'http://localhost:3000,http://127.0.0.1:3000';
  return allowedOriginsStr
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

/**
 * 应用配置
 */
export const config = {
  // ChatGLM API配置
  chatglm: {
    apiBase: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: getApiKey(),
    model: process.env.CHATGLM_MODEL || 'glm-4.5-airx',
  },
  
  // CORS配置
  cors: {
    allowedOrigins: getAllowedOrigins(),
    // Cloudflare Pages 域名正则
    allowedOriginRegex: /^https:\/\/.*\.(pages\.dev|cloudflarepages\.app)$/,
  },
  
  // 服务器配置
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '8000', 10),
  },
  
  // API超时配置（毫秒）
  timeouts: {
    stream: 60000,      // 60秒
    completion: 60000,  // 60秒
    suggestedReplies: 8000,  // 8秒
    agentProfile: 30000,    // 30秒
  },
} as const;

// 检查API Key配置
if (!config.chatglm.apiKey) {
  console.warn('警告: CHATGLM_API_KEY 环境变量未设置');
}

