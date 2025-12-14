/**
 * 类型定义文件
 * 定义所有接口、请求和响应的类型
 */

/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * 聊天请求接口
 */
export interface ChatRequest {
  messages: ChatMessage[];
  system_prompt?: string;
  model?: string;
  stream?: boolean;
}

/**
 * 建议回复请求接口
 */
export interface SuggestedRepliesRequest {
  conversation_history: ChatMessage[];
}

/**
 * 智能体配置请求接口
 */
export interface AgentProfileRequest {
  initial_prompt: string;
}

/**
 * ChatGLM API 响应中的选择项
 */
export interface ChatGLMChoice {
  index: number;
  message?: {
    role: MessageRole;
    content: string;
  };
  delta?: {
    role?: MessageRole;
    content?: string;
  };
  finish_reason?: string | null;
}

/**
 * ChatGLM API 使用统计
 */
export interface ChatGLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * ChatGLM API 完整响应
 */
export interface ChatGLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatGLMChoice[];
  usage?: ChatGLMUsage;
}

/**
 * ChatGLM API 流式响应数据块
 */
export interface ChatGLMStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatGLMChoice[];
  usage?: ChatGLMUsage;
}

/**
 * SSE 响应数据格式
 */
export interface SSEResponseData {
  text?: string;
  error?: string;
  done?: boolean;
  usage?: ChatGLMUsage;
}

/**
 * 建议回复响应
 */
export interface SuggestedRepliesResponse {
  suggestions: string[];
}

/**
 * 智能体配置响应
 */
export interface AgentProfileResponse {
  name: string;
  description: string;
  systemPrompt: string;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: string;
  api_key_configured: boolean;
  model: string;
}

/**
 * API 错误响应
 */
export interface APIErrorResponse {
  error: string;
  detail?: string;
  status_code?: number;
}

/**
 * ChatGLM API 请求载荷
 */
export interface ChatGLMPayload {
  model: string;
  messages: Array<{
    role: MessageRole;
    content: string;
  }>;
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: 'json_object';
  };
}

