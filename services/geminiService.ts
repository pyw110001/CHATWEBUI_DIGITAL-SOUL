// This service has been updated to use the Zhipu AI ChatGLM API.
import { Message, Agent } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set for Zhipu AI. It should be in the format 'id.secret'");
}

const API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/**
 * Generates a JSON Web Token (JWT) for authenticating with the Zhipu AI API.
 * This uses the Web Crypto API available in modern browsers.
 * @param apiKey The API key from Zhipu AI, in the format "id.secret".
 * @returns A promise that resolves to the generated JWT.
 */
async function generateJwt(apiKey: string): Promise<string> {
    const [id, secret] = apiKey.split('.');
    if (!id || !secret) {
        throw new Error('Invalid Zhipu AI API Key. Expected format: id.secret');
    }

    const header = { alg: 'HS256', sign_type: 'SIGN' };
    const payload = {
        api_key: id,
        exp: Date.now() + 60 * 60 * 1000, // 1-hour expiration
        timestamp: Date.now(),
    };
    
    const base64UrlEncode = (data: ArrayBuffer | string) => {
        const str = data instanceof ArrayBuffer ? String.fromCharCode(...new Uint8Array(data)) : data;
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureInput));
    const encodedSignature = base64UrlEncode(signature);

    return `${signatureInput}.${encodedSignature}`;
}

/**
 * Maps the application's internal message format to the format required by the ChatGLM API.
 * It also injects the system prompt and filters out the initial UI-only greeting message.
 */
const mapMessagesToChatGLM = (messages: Message[], systemPrompt: string) => {
    const glmMessages: { role: 'system' | 'user' | 'assistant', content: string }[] = [{ role: 'system', content: systemPrompt }];
    
    const filteredMessages = messages.filter(msg => msg.id !== 'init');

    filteredMessages.forEach(msg => {
        if (msg.sender === 'user') {
            glmMessages.push({ role: 'user', content: msg.text });
        } else if (msg.sender === 'ai') {
            glmMessages.push({ role: 'assistant', content: msg.text });
        }
    });
    return glmMessages;
};

/**
 * Sends a message to the ChatGLM API and returns the response as an async generator stream.
 */
export async function* streamChat(history: Message[], systemPrompt: string, newMessage: string) {
    const messagesForApi = mapMessagesToChatGLM(history, systemPrompt);
    messagesForApi.push({ role: 'user', content: newMessage });
    
    const token = await generateJwt(process.env.API_KEY!);
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            model: 'glm-4-air',
            messages: messagesForApi,
            stream: true,
        }),
    });

    if (!response.ok || !response.body) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim();
                if (dataStr === '[DONE]') return;
                try {
                    const data = JSON.parse(dataStr);
                    const textChunk = data.choices?.[0]?.delta?.content;
                    if (textChunk) yield textChunk;
                } catch (e) {
                    console.error('Error parsing SSE chunk:', dataStr, e);
                }
            }
        }
    }
}

/**
 * Fetches suggested replies from the ChatGLM API using its function calling feature.
 */
export async function getSuggestedReplies(history: Message[]): Promise<string[]> {
     const messages = mapMessagesToChatGLM(history, '你是一个对话助手，负责根据对话历史生成相关的建议回复。');
     const tools = [{
        type: "function",
        function: {
            name: "generate_suggestions",
            description: "为用户生成3个简短、相关且引人入胜的建议回复。",
            parameters: {
                type: "object",
                properties: { suggestions: { type: "array", items: { type: "string" } } },
                required: ["suggestions"],
            },
        },
    }];
    
    try {
        const token = await generateJwt(process.env.API_KEY!);
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ model: 'glm-4-air', messages, tools, tool_choice: "auto" }),
        });
        const data = await response.json();
        const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) {
            return JSON.parse(args).suggestions || [];
        }
        return [];
    } catch (error) {
        console.error("Error fetching suggested replies:", error);
        return [];
    }
}

/**
 * Creates a new AI agent profile using the ChatGLM API's function calling feature.
 */
export async function createAgentProfile(initialPrompt: string): Promise<Pick<Agent, 'name' | 'description' | 'systemPrompt'>> {
    const messages = [{ role: 'user', content: `根据用户的初始请求，为AI智能体创建一个角色。该角色应包括一个简短、引人注目的中文名称、一句中文描述以及一个定义其角色和个性的系统提示。\n\n用户请求: "${initialPrompt}"` }];
    const tools = [{
        type: "function",
        function: {
            name: "create_agent_profile",
            description: "创建AI智能体角色",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    systemPrompt: { type: "string" },
                },
                required: ["name", "description", "systemPrompt"],
            },
        },
    }];

    try {
        const token = await generateJwt(process.env.API_KEY!);
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ model: 'glm-4-air', messages, tools, tool_choice: "auto" }),
        });
        const data = await response.json();
        const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) return JSON.parse(args);
    } catch (error) {
        console.error("Error creating agent profile:", error);
    }
    
    return {
      name: "新智能体",
      description: initialPrompt,
      systemPrompt: "你是一个乐于助人的AI助手。",
    };
}
