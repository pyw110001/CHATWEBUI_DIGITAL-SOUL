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
      contents: `Based on the following conversation, suggest 3 short, relevant, and engaging replies for the user.
      
      Conversation:
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
      contents: `Based on the user's initial request, create a persona for an AI agent. The persona should include a short, catchy name, a one-sentence description, and a system prompt that defines its role and personality.
      
      User Request: "${initialPrompt}"
      
      Provide the output in JSON format.`,
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
      name: "New Agent",
      description: initialPrompt,
      systemPrompt: "You are a helpful AI assistant.",
    };
  }
}
