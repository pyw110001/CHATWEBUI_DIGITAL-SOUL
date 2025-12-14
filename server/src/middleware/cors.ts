/**
 * CORS中间件配置
 */
import cors, { CorsOptions } from 'cors';
import { config } from '../config/index.js';

/**
 * 检查源是否允许
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  
  // 检查是否在允许的源列表中
  if (config.cors.allowedOrigins.includes(origin)) {
    return true;
  }
  
  // 检查是否匹配Cloudflare Pages域名正则
  if (config.cors.allowedOriginRegex.test(origin)) {
    return true;
  }
  
  return false;
}

/**
 * CORS配置选项
 */
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * CORS中间件
 */
export const corsMiddleware = cors(corsOptions);

