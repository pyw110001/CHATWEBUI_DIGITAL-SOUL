/**
 * 聊天相关路由
 */
import { Router, Request, Response } from 'express';
import { chatCompletions, streamChatCompletions, buildMessages } from '../api/chatglmApi.js';
import { config } from '../config/index.js';
import { handleAxiosError, formatSSEError } from '../utils/errors.js';
import type {
  ChatRequest,
  SuggestedRepliesRequest,
  AgentProfileRequest,
} from '../types/index.js';

const router = Router();

/**
 * 流式聊天接口
 * POST /api/chat/stream
 */
router.post('/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.chatglm.apiKey) {
      res.status(500).json({ error: 'ChatGLM API Key未配置' });
      return;
    }

    const request: ChatRequest = req.body;
    
    // 构建消息列表
    const messages = buildMessages(request.messages, request.system_prompt);
    
    // 构建ChatGLM API请求
    const model = request.model || config.chatglm.model;
    const payload = {
      model,
      messages,
      stream: true,
    };

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const stream = await streamChatCompletions(payload);
      
      stream.on('data', (chunk: Buffer) => {
        res.write(chunk);
      });

      stream.on('end', () => {
        res.end();
      });

      stream.on('error', (error: Error) => {
        res.write(formatSSEError(`流式响应错误: ${error.message}`));
        res.end();
      });
    } catch (error) {
      const errorInfo = handleAxiosError(error);
      res.write(formatSSEError(`API错误: ${errorInfo.detail || errorInfo.message}`));
      res.end();
    }
  } catch (error) {
    const errorInfo = handleAxiosError(error);
    res.status(500).json({ error: errorInfo.message, detail: errorInfo.detail });
  }
});

/**
 * 非流式聊天接口
 * POST /api/chat/completions
 */
router.post('/completions', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.chatglm.apiKey) {
      res.status(500).json({ error: 'ChatGLM API Key未配置' });
      return;
    }

    const request: ChatRequest = req.body;
    
    // 构建消息列表
    const messages = buildMessages(request.messages, request.system_prompt);
    
    // 构建ChatGLM API请求
    const model = request.model || config.chatglm.model;
    const payload = {
      model,
      messages,
      stream: false,
    };

    try {
      const response = await chatCompletions(payload);
      res.json(response);
    } catch (error) {
      const errorInfo = handleAxiosError(error);
      res.status(errorInfo.statusCode).json({
        error: errorInfo.message,
        detail: errorInfo.detail,
      });
    }
  } catch (error) {
    const errorInfo = handleAxiosError(error);
    res.status(500).json({ error: errorInfo.message, detail: errorInfo.detail });
  }
});

/**
 * 获取建议回复
 * POST /api/suggested-replies
 */
router.post('/suggested-replies', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.chatglm.apiKey) {
      res.json({ suggestions: [] });
      return;
    }

    const request: SuggestedRepliesRequest = req.body;
    
    // 构建对话历史（只取最近3轮对话以减少token数）
    const recentHistory = request.conversation_history.length > 6
      ? request.conversation_history.slice(-6)
      : request.conversation_history;
    
    const conversationText = recentHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const messages = [
      {
        role: 'user' as const,
        content: `根据以下对话，为用户建议3个简短、相关且引人入胜的回复（每个回复不超过15字）。

对话:
${conversationText}

请以JSON格式提供输出，格式为: {"suggestions": ["回复1", "回复2", "回复3"]}`,
      },
    ];

    const payload = {
      model: config.chatglm.model,
      messages,
      stream: false,
      response_format: { type: 'json_object' as const },
      temperature: 0.7,
      max_tokens: 100, // 限制token数以加快响应
    };

    try {
      const response = await chatCompletions(payload);
      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        const parsed = JSON.parse(content);
        res.json({ suggestions: parsed.suggestions || [] });
      } catch {
        res.json({ suggestions: [] });
      }
    } catch (error) {
      console.error('获取建议回复错误:', error);
      res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error('获取建议回复错误:', error);
    res.json({ suggestions: [] });
  }
});

/**
 * 创建智能体配置
 * POST /api/agent-profile
 */
router.post('/agent-profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.chatglm.apiKey) {
      res.json({
        name: '新智能体',
        description: req.body.initial_prompt || '',
        systemPrompt: '你是一个乐于助人的AI助手。',
      });
      return;
    }

    const request: AgentProfileRequest = req.body;

    const messages = [
      {
        role: 'user' as const,
        content: `根据用户的初始请求，为AI智能体创建一个角色。该角色应包括一个简短、引人注目的中文名称、一句中文描述以及一个定义其角色和个性的系统提示。

用户请求: "${request.initial_prompt}"

请以JSON格式提供输出，格式为: {"name": "名称", "description": "描述", "systemPrompt": "系统提示"}`,
      },
    ];

    const payload = {
      model: config.chatglm.model,
      messages,
      stream: false,
      response_format: { type: 'json_object' as const },
    };

    try {
      const response = await chatCompletions(payload);
      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        const parsed = JSON.parse(content);
        res.json({
          name: parsed.name || '新智能体',
          description: parsed.description || request.initial_prompt,
          systemPrompt: parsed.systemPrompt || '你是一个乐于助人的AI助手。',
        });
      } catch {
        res.json({
          name: '新智能体',
          description: request.initial_prompt,
          systemPrompt: '你是一个乐于助人的AI助手。',
        });
      }
    } catch (error) {
      console.error('创建智能体配置错误:', error);
      res.json({
        name: '新智能体',
        description: request.initial_prompt,
        systemPrompt: '你是一个乐于助人的AI助手。',
      });
    }
  } catch (error) {
    console.error('创建智能体配置错误:', error);
    const request: AgentProfileRequest = req.body;
    res.json({
      name: '新智能体',
      description: request.initial_prompt || '',
      systemPrompt: '你是一个乐于助人的AI助手。',
    });
  }
});

export default router;

