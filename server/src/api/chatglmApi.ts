/**
 * ChatGLM API调用模块
 * 使用axios进行HTTP请求
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { config } from '../config/index.js';
import { handleAxiosError } from '../utils/errors.js';
import type {
  ChatGLMPayload,
  ChatGLMResponse,
  ChatGLMStreamChunk,
  MessageRole,
} from '../types/index.js';

/**
 * 创建ChatGLM API客户端
 */
function createApiClient(): AxiosInstance {
  if (!config.chatglm.apiKey) {
    throw new Error('ChatGLM API Key未配置');
  }

  const apiKey = config.chatglm.apiKey.trim();
  
  // 验证API Key格式（智谱AI API Key通常包含点号）
  if (!apiKey || apiKey.length < 10) {
    throw new Error('API Key格式无效');
  }
  
  return axios.create({
    baseURL: config.chatglm.apiBase,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: config.timeouts.completion,
  });
}

/**
 * 获取ChatGLM API请求头
 */
export function getChatGLMHeaders(): Record<string, string> {
  if (!config.chatglm.apiKey) {
    throw new Error('ChatGLM API Key未配置');
  }
  
  const apiKey = config.chatglm.apiKey.trim();
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 非流式聊天请求
 */
export async function chatCompletions(
  payload: ChatGLMPayload
): Promise<ChatGLMResponse> {
  const client = createApiClient();
  
  try {
    const response: AxiosResponse<ChatGLMResponse> = await client.post(
      '/chat/completions',
      payload
    );
    
    if (response.status !== 200) {
      throw new Error(`API返回错误状态码: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    const errorInfo = handleAxiosError(error);
    throw new Error(`${errorInfo.message}: ${errorInfo.detail || ''}`);
  }
}

/**
 * 流式聊天请求
 * 返回一个Readable流，用于SSE响应
 */
export async function streamChatCompletions(
  payload: ChatGLMPayload
): Promise<Readable> {
  if (!config.chatglm.apiKey) {
    throw new Error('ChatGLM API Key未配置');
  }

  const apiKey = config.chatglm.apiKey.trim();
  
  // 创建可读流
  const readable = new Readable({
    objectMode: false,
    read() {
      // 由底层流驱动
    },
  });

  try {
    // 使用axios创建流式请求
    const response = await axios.post(
      `${config.chatglm.apiBase}/chat/completions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: config.timeouts.stream,
        validateStatus: () => true, // 允许所有状态码，手动处理
      }
    );

    // 检查响应状态
    if (response.status !== 200) {
      // 读取错误响应体
      let errorBody = '';
      response.data.on('data', (chunk: Buffer) => {
        errorBody += chunk.toString('utf-8');
      });
      response.data.on('end', () => {
        readable.push(`data: ${JSON.stringify({ error: `API错误: ${errorBody || response.statusText}` })}\n\n`);
        readable.push(null);
      });
      return readable;
    }

    // 处理流式响应
    let buffer = '';
    
    response.data.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf-8');
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留最后一个不完整的行

    for (const line of lines) {
      if (line.trim() === '') continue;
      
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6); // 移除 "data: " 前缀
        
        if (dataStr.trim() === '[DONE]') {
          readable.push(`data: ${JSON.stringify({ done: true })}\n\n`);
          readable.push(null); // 结束流
          break; // 使用break而不是return，因为这是在for循环中
        }

        try {
          const data: ChatGLMStreamChunk = JSON.parse(dataStr);
          
          // 提取增量内容
          if (data.choices && data.choices.length > 0) {
            const delta = data.choices[0].delta;
            const content = delta?.content || '';
            
            if (content) {
              readable.push(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
            
            // 检查是否完成
            const finishReason = data.choices[0].finish_reason;
            if (finishReason) {
              // 发送使用统计（如果有）
              if (data.usage) {
                readable.push(`data: ${JSON.stringify({ usage: data.usage })}\n\n`);
              }
              readable.push(`data: ${JSON.stringify({ done: true })}\n\n`);
              readable.push(null); // 结束流
              break; // 使用break而不是return
            }
          }
        } catch (parseError) {
          // 忽略JSON解析错误，继续处理下一行
          continue;
        }
      }
    }
  });

    response.data.on('end', () => {
      // 处理剩余的buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === '[DONE]') {
              readable.push(`data: ${JSON.stringify({ done: true })}\n\n`);
              break;
            }
          }
        }
      }
      readable.push(null); // 结束流
    });

    response.data.on('error', (error: Error) => {
      readable.push(`data: ${JSON.stringify({ error: `流式响应错误: ${error.message}` })}\n\n`);
      readable.push(null);
    });
  } catch (error) {
    // 处理请求错误
    const errorInfo = handleAxiosError(error);
    readable.push(`data: ${JSON.stringify({ error: `流式响应错误: ${errorInfo.message}` })}\n\n`);
    readable.push(null);
  }

  return readable;
}

/**
 * 构建消息列表（包含system prompt）
 */
export function buildMessages(
  messages: Array<{ role: MessageRole; content: string }>,
  systemPrompt?: string
): Array<{ role: MessageRole; content: string }> {
  const result: Array<{ role: MessageRole; content: string }> = [];
  
  // 如果有system_prompt，添加到消息列表开头
  if (systemPrompt) {
    result.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  // 添加用户消息
  for (const msg of messages) {
    result.push({
      role: msg.role,
      content: msg.content,
    });
  }
  
  return result;
}

