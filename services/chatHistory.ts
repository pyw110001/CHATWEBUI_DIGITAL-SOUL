import { Message, Agent } from '../types';

export interface ChatHistory {
  id: string;
  agentId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  title?: string; // 对话标题（第一条用户消息的前20个字符）
}

const STORAGE_PREFIX = 'chat_history_';

/**
 * 获取指定智能体的所有历史记录
 */
export function getChatHistories(agentId: string): ChatHistory[] {
  try {
    const key = `${STORAGE_PREFIX}${agentId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load chat histories:', error);
    return [];
  }
}

/**
 * 保存历史记录
 */
export function saveChatHistory(history: ChatHistory): void {
  try {
    const key = `${STORAGE_PREFIX}${history.agentId}`;
    const histories = getChatHistories(history.agentId);
    
    // 检查是否已存在（更新）或添加新的
    const existingIndex = histories.findIndex(h => h.id === history.id);
    if (existingIndex >= 0) {
      histories[existingIndex] = history;
    } else {
      histories.unshift(history); // 新对话添加到最前面
    }
    
    // 限制最多保存50条历史记录
    const limitedHistories = histories.slice(0, 50);
    
    localStorage.setItem(key, JSON.stringify(limitedHistories));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * 删除指定的历史记录
 */
export function deleteChatHistory(agentId: string, historyId: string): void {
  try {
    const key = `${STORAGE_PREFIX}${agentId}`;
    const histories = getChatHistories(agentId);
    const filtered = histories.filter(h => h.id !== historyId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete chat history:', error);
  }
}

/**
 * 创建新的历史记录
 */
export function createChatHistory(agentId: string, messages: Message[]): ChatHistory {
  // 生成标题（第一条用户消息的前20个字符）
  const firstUserMessage = messages.find(m => m.sender === 'user');
  const title = firstUserMessage 
    ? firstUserMessage.text.substring(0, 20) + (firstUserMessage.text.length > 20 ? '...' : '')
    : '新对话';
  
  return {
    id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId,
    messages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title,
  };
}

/**
 * 更新历史记录的消息
 */
export function updateChatHistory(agentId: string, historyId: string, messages: Message[]): void {
  const histories = getChatHistories(agentId);
  const history = histories.find(h => h.id === historyId);
  if (history) {
    history.messages = messages;
    history.updatedAt = Date.now();
    saveChatHistory(history);
  }
}

