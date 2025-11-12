import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Message, Agent } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function startChatSession(systemPrompt: string): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemPrompt,
    },
  });
  return chat;
}

export async function streamMessage(chat: Chat, message: string) {
  return chat.sendMessageStream({ message });
}

export async function getSuggestedReplies(history: Message[]): Promise<string[]> {
  const conversationHistory = history.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `根据以下对话，为用户建议3个简短、相关且引人入胜的回复。
      
      对话:
      ${conversationHistory}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["suggestions"],
        },
      },
    });

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Error fetching suggested replies:", error);
    return [];
  }
}


export async function createAgentProfile(initialPrompt: string): Promise<Pick<Agent, 'name' | 'description' | 'systemPrompt'>> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `根据用户的初始请求，为AI智能体创建一个角色。该角色应包括一个简短、引人注目的中文名称、一句中文描述以及一个定义其角色和个性的系统提示。
      
      用户请求: "${initialPrompt}"
      
      请以JSON格式提供输出。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            systemPrompt: { type: Type.STRING },
          },
          required: ["name", "description", "systemPrompt"],
        },
      },
    });

    const jsonString = response.text;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error creating agent profile:", error);
    // Fallback profile
    return {
      name: "新智能体",
      description: initialPrompt,
      systemPrompt: "你是一个乐于助人的AI助手。",
    };
  }
}
