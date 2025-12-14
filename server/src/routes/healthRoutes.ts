/**
 * 健康检查路由
 */
import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import type { HealthCheckResponse } from '../types/index.js';

const router = Router();

/**
 * 健康检查接口
 * GET /api/health
 */
router.get('/', (_req: Request, res: Response): void => {
  const response: HealthCheckResponse = {
    status: 'ok',
    api_key_configured: Boolean(config.chatglm.apiKey),
    model: config.chatglm.model,
  };
  
  res.json(response);
});

export default router;

