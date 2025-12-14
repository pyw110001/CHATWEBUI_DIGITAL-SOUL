/**
 * 错误处理中间件
 */
import { Request, Response, NextFunction } from 'express';
import { handleAxiosError } from '../utils/errors.js';

/**
 * 错误处理中间件
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorInfo = handleAxiosError(err);
  
  res.status(errorInfo.statusCode).json({
    error: errorInfo.message,
    detail: errorInfo.detail,
  });
}

/**
 * 404处理中间件
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    error: '接口不存在',
    path: req.path,
  });
}

