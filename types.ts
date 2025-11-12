
export enum Page {
  LOGIN,
  EXPLORER,
  CHAT,
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
}
