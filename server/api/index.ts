/**
 * Vercel Serverless Functions 入口文件
 * 将 Express 应用导出为 Serverless Function
 */
import { createApp } from '../src/index.js';

// 导出 Express 应用实例
const app = createApp();

// Vercel 需要导出默认的 handler
export default app;

