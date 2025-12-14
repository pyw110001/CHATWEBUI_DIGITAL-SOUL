/**
 * Express服务器主入口文件
 */
import express, { Express } from 'express';
import { config } from './config/index.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import chatRoutes from './routes/chatRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

/**
 * 创建Express应用
 */
function createApp(): Express {
  const app = express();

  // 中间件
  app.use(express.json()); // 解析JSON请求体
  app.use(corsMiddleware); // CORS支持

  // 根路径 - API信息
  app.get('/', (_req, res) => {
    res.json({
      name: 'ChatGLM API Service',
      version: '1.0.0',
      description: 'ChatGLM API代理服务 - TypeScript/Express后端',
      endpoints: {
        health: '/api/health',
        chat: {
          stream: 'POST /api/chat/stream',
          completions: 'POST /api/chat/completions',
        },
        suggestedReplies: 'POST /api/suggested-replies',
        agentProfile: 'POST /api/agent-profile',
      },
      status: 'running',
      model: config.chatglm.model,
      api_key_configured: Boolean(config.chatglm.apiKey),
    });
  });

  // 路由
  app.use('/api/chat', chatRoutes);
  app.use('/api/health', healthRoutes);

  // 404处理
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  return app;
}

/**
 * 启动服务器
 */
function startServer(): void {
  const app = createApp();
  
  app.listen(config.server.port, config.server.host, () => {
    console.log(`🚀 ChatGLM API Service 启动成功`);
    console.log(`📍 服务地址: http://${config.server.host}:${config.server.port}`);
    console.log(`🔑 API Key配置: ${config.chatglm.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
    console.log(`🤖 默认模型: ${config.chatglm.model}`);
    console.log(`🌐 允许的源: ${config.cors.allowedOrigins.join(', ')}`);
  });
}

// 启动服务器
startServer();

