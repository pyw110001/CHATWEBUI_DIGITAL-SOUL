/**
 * 错误处理工具
 */
import { AxiosError } from 'axios';
import { APIErrorResponse } from '../types/index.js';

/**
 * 创建API错误响应
 */
export function createErrorResponse(
  error: string,
  detail?: string,
  statusCode?: number
): APIErrorResponse {
  return {
    error,
    detail,
    status_code: statusCode,
  };
}

/**
 * 处理Axios错误
 */
export function handleAxiosError(error: unknown): {
  message: string;
  statusCode: number;
  detail?: string;
} {
  if (error instanceof AxiosError) {
    // Axios错误
    if (error.response) {
      // 服务器返回了错误响应
      return {
        message: `API错误: ${error.response.status}`,
        statusCode: error.response.status,
        detail: typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data),
      };
    } else if (error.request) {
      // 请求已发送但没有收到响应
      return {
        message: 'API请求超时或网络错误',
        statusCode: 500,
        detail: error.message,
      };
    } else {
      // 请求配置错误
      return {
        message: '请求配置错误',
        statusCode: 500,
        detail: error.message,
      };
    }
  }
  
  // 其他类型的错误
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      detail: error.stack,
    };
  }
  
  // 未知错误
  return {
    message: '未知错误',
    statusCode: 500,
    detail: String(error),
  };
}

/**
 * 格式化错误消息用于SSE响应
 */
export function formatSSEError(error: string): string {
  return `data: ${JSON.stringify({ error })}\n\n`;
}

