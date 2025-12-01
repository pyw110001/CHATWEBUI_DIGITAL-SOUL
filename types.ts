
export enum Page {
  LOGIN,
  EXPLORER,
  CHAT,
  MULTI_AGENT_SELECT,
  MULTI_AGENT_CHAT,
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  avatarUrl: string;
  imageUrl: string;
  systemPrompt: string;
  interactionCount?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  agentId?: string; // 多智能体对话时标识是哪个智能体
  agentName?: string; // 多智能体对话时显示智能体名称
}
