/**
 * ChatGLM API服务
 * 通过Python后端调用ChatGLM API
 */

import { Message, Agent } from '../types';

// 后端API地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 聊天会话接口（用于兼容原有代码结构）
export interface ChatSession {
  sessionId: string;
  systemPrompt: string;
}

// 存储会话消息历史
const sessionHistories: Map<string, Message[]> = new Map();

/**
 * 创建新的聊天会话
 */
export function startChatSession(systemPrompt: string): ChatSession {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionHistories.set(sessionId, []);
  return { sessionId, systemPrompt };
}

/**
 * 流式发送消息
 */
export async function* streamMessage(session: ChatSession, message: string): AsyncGenerator<{ text: string }, void, unknown> {
  const history = sessionHistories.get(session.sessionId) || [];
  
  // 构建消息列表
  const messages = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));
  
  // 添加当前用户消息
  messages.push({
    role: 'user',
    content: message
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        system_prompt: session.systemPrompt,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6); // 移除 "data: " 前缀
          
          if (dataStr.trim() === '[DONE]' || dataStr.includes('"done":true')) {
            return;
          }

          try {
            const data = JSON.parse(dataStr);
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (data.text) {
              yield { text: data.text };
            }
          } catch (e) {
            // 忽略JSON解析错误，继续处理下一行
            if (e instanceof SyntaxError) {
              continue;
            }
            throw e;
          }
        }
      }
    }
  } catch (error) {
    console.error('流式消息错误:', error);
    throw error;
  }
}

/**
 * 获取建议回复
 */
export async function getSuggestedReplies(history: Message[]): Promise<string[]> {
  try {
    const conversationHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const response = await fetch(`${API_BASE_URL}/api/suggested-replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_history: conversationHistory
      })
    });

    if (!response.ok) {
      console.error('获取建议回复失败:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('获取建议回复错误:', error);
    return [];
  }
}

/**
 * 创建智能体配置
 */
export async function createAgentProfile(initialPrompt: string): Promise<Pick<Agent, 'name' | 'description' | 'systemPrompt'>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agent-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initial_prompt: initialPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      name: data.name || '新智能体',
      description: data.description || initialPrompt,
      systemPrompt: data.systemPrompt || '你是一个乐于助人的AI助手。'
    };
  } catch (error) {
    console.error('创建智能体配置错误:', error);
    // 返回默认配置
    return {
      name: '新智能体',
      description: initialPrompt,
      systemPrompt: '你是一个乐于助人的AI助手。'
    };
  }
}

/**
 * 更新会话历史（用于记录消息）
 */
export function updateSessionHistory(sessionId: string, message: Message) {
  const history = sessionHistories.get(sessionId) || [];
  history.push(message);
  sessionHistories.set(sessionId, history);
}

/**
 * 获取会话历史
 */
export function getSessionHistory(sessionId: string): Message[] {
  return sessionHistories.get(sessionId) || [];
}

