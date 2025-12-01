import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent, Message } from '../../types';
import { startChatSession, streamMessage, ChatSession } from '../../services/chatglmService';

interface MultiAgentChatPageProps {
  agents: Agent[];
  onBack: () => void;
}

interface AgentState {
  agent: Agent;
  session: ChatSession | null;
  consecutiveCount: number; // 连续发言次数
  lastSpokeIndex: number; // 最后发言的位置
}

const MultiAgentChatPage: React.FC<MultiAgentChatPageProps> = ({ agents, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounterRef = useRef(0);
  const conversationContextRef = useRef<string>(''); // 记录对话上下文，用于判断话题是否偏离

  // 生成唯一的消息 ID
  const generateMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return `msg-${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  // 初始化智能体会话
  useEffect(() => {
    const states: AgentState[] = agents.map(agent => ({
      agent,
      session: null,
      consecutiveCount: 0,
      lastSpokeIndex: -1,
    }));

    try {
      states.forEach(state => {
        state.session = startChatSession(state.agent.systemPrompt);
      });
      setAgentStates(states);
      
      // 添加初始欢迎消息（使用第一个智能体的信息作为系统消息）
      const welcomeMessage: Message = {
        id: 'init',
        sender: 'ai',
        text: `欢迎进入多智能体对话！${agents.map(a => a.name).join('、')} 已就位，随时为您服务。`,
        agentId: agents[0]?.id || '',
        agentName: '系统',
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Failed to initialize agent sessions:", error);
    }
  }, [agents]);

  // 检查话题是否偏离用户原问题
  const checkTopicDeviation = (userQuestion: string, recentMessages: Message[]): boolean => {
    if (recentMessages.length < 3) return false;
    
    // 获取最近3条AI消息
    const recentAIMessages = recentMessages
      .filter(m => m.sender === 'ai')
      .slice(-3)
      .map(m => m.text)
      .join(' ');
    
    // 简单检查：如果最近的消息中没有包含用户问题的关键词，可能偏离了
    const userKeywords = userQuestion.split(/\s+/).filter(w => w.length > 2);
    const hasRelevantKeywords = userKeywords.some(keyword => 
      recentAIMessages.toLowerCase().includes(keyword.toLowerCase())
    );
    
    return !hasRelevantKeywords && recentAIMessages.length > 50;
  };

  // 生成增强的系统提示，包含多智能体对话规则
  const generateEnhancedSystemPrompt = (
    agent: Agent,
    userMessage: string,
    otherAgentsResponses: Message[],
    isFirstResponse: boolean,
    shouldRefocus: boolean
  ): string => {
    const otherAgentsNames = agents.filter(a => a.id !== agent.id).map(a => a.name).join('、');
    
    let enhancedPrompt = `${agent.systemPrompt}\n\n`;
    enhancedPrompt += `【多智能体对话规则】\n`;
    enhancedPrompt += `你现在正在参与一个多智能体对话，其他智能体包括：${otherAgentsNames}。\n\n`;
    
    if (isFirstResponse) {
      enhancedPrompt += `【当前任务】用户刚刚提问："${userMessage}"\n`;
      enhancedPrompt += `请优先直接回答用户的问题（1-3句话），必须符合你的角色设定和擅长领域。\n\n`;
    } else {
      enhancedPrompt += `【当前任务】其他智能体已经发言，请基于他们的观点进行互动：\n`;
      otherAgentsResponses.forEach(msg => {
        enhancedPrompt += `- ${msg.agentName}: ${msg.text}\n`;
      });
      enhancedPrompt += `\n请进行互动（追问细节、补充观点、提出不同意见等），控制在1-3句话，必须符合你的角色设定。\n\n`;
    }

    if (shouldRefocus) {
      enhancedPrompt += `【重要提醒】对话可能偏离了用户原问题"${userMessage}"，请主动将话题拉回主题。\n\n`;
    }

    enhancedPrompt += `【发言要求】\n`;
    enhancedPrompt += `1. 发言必须符合你的角色设定和擅长领域\n`;
    enhancedPrompt += `2. 控制在1-3句话，避免长篇大论\n`;
    enhancedPrompt += `3. 保持自然对话风格\n`;
    if (shouldRefocus) {
      enhancedPrompt += `4. 必须主动将话题拉回用户原问题\n`;
    }

    return enhancedPrompt;
  };

  // 智能体发言
  const handleAgentSpeak = async (
    agentState: AgentState,
    userMessage: string,
    conversationHistory: Message[],
    otherAgentsResponses: Message[],
    isFirstResponse: boolean,
    shouldRefocus: boolean
  ): Promise<string | null> => {
    if (!agentState.session) return null;

    try {
      // 生成增强的系统提示
      const enhancedSystemPrompt = generateEnhancedSystemPrompt(
        agentState.agent,
        userMessage,
        otherAgentsResponses,
        isFirstResponse,
        shouldRefocus
      );

      // 构建对话历史（转换为API格式）
      const apiMessages = conversationHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.sender === 'user' 
          ? msg.text 
          : `${msg.agentName || 'AI'}: ${msg.text}`
      }));

      // 如果是第一轮回复，直接使用用户消息
      // 如果是互动轮，使用一个简短的提示来触发互动
      const currentMessage = isFirstResponse 
        ? userMessage
        : `请基于其他智能体的发言进行互动（追问细节、补充观点、提出不同意见等），控制在1-3句话。${shouldRefocus ? '注意：对话可能偏离了用户原问题，请主动将话题拉回主题。' : ''}`;

      // 调用API，使用增强的系统提示
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...apiMessages, { role: 'user', content: currentMessage }],
          system_prompt: enhancedSystemPrompt,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === '[DONE]' || dataStr.includes('"done":true')) {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                responseText += data.text;
              }
            } catch (e) {
              if (!(e instanceof SyntaxError)) throw e;
            }
          }
        }
      }

      // 限制长度（1-3句话）
      const sentences = responseText.split(/[。！？]/).filter(s => s.trim().length > 0);
      if (sentences.length > 3) {
        responseText = sentences.slice(0, 3).join('。') + '。';
      }

      return responseText.trim();
    } catch (error) {
      console.error(`Agent ${agentState.agent.name} failed to respond:`, error);
      return null;
    }
  };

  // 处理用户消息
  const handleSendMessage = async (messageText: string) => {
    if (messageText.trim() === '' || isLoading || agentStates.length === 0) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: generateMessageId(),
      sender: 'user',
      text: messageText,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    conversationContextRef.current = messageText; // 记录用户原问题

    try {
      const conversationHistory = [...messages, userMessage];
      
      // 第一轮：所有智能体先回答用户问题
      const firstRoundPromises = agentStates.map(async (agentState, index) => {
        const response = await handleAgentSpeak(
          agentState,
          messageText,
          conversationHistory,
          [],
          true,
          false
        );
        return response ? {
          agent: agentState.agent,
          text: response,
          index,
        } : null;
      });

      const firstRoundResponses = (await Promise.all(firstRoundPromises))
        .filter((r): r is { agent: Agent; text: string; index: number } => r !== null);

      // 添加第一轮回复
      const firstRoundMessages: Message[] = firstRoundResponses.map(({ agent, text }) => ({
        id: generateMessageId(),
        sender: 'ai',
        text,
        agentId: agent.id,
        agentName: agent.name,
      }));

      setMessages(prev => [...prev, ...firstRoundMessages]);

      // 更新智能体状态
      setAgentStates(prev => prev.map((state, idx) => {
        const responded = firstRoundResponses.find(r => r.index === idx);
        if (responded) {
          return {
            ...state,
            consecutiveCount: 1,
            lastSpokeIndex: prev.length + firstRoundMessages.length - 1,
          };
        }
        return state;
      }));

      // 第二轮：智能体互相互动（最多2轮）
      let currentHistory = [...conversationHistory, ...firstRoundMessages];
      let roundCount = 0;
      const maxRounds = 2;

      while (roundCount < maxRounds) {
        // 检查话题是否偏离
        const topicDeviated = checkTopicDeviation(messageText, currentHistory);
        
        // 选择可以发言的智能体（连续发言不超过2次）
        const availableAgents = agentStates
          .map((state, idx) => ({ state, idx }))
          .filter(({ state }) => state.consecutiveCount < 2)
          .sort((a, b) => a.state.lastSpokeIndex - b.state.lastSpokeIndex); // 优先让发言少的智能体说话

        if (availableAgents.length === 0) break;

        // 随机选择1-2个智能体发言
        const agentsToSpeak = availableAgents
          .slice(0, Math.min(2, availableAgents.length))
          .map(({ state, idx }) => ({ state, idx }));

        const otherResponses = currentHistory
          .filter(m => m.sender === 'ai' && m.agentId)
          .slice(-agents.length * 2); // 获取最近的AI回复

        const interactionPromises = agentsToSpeak.map(async ({ state, idx }) => {
          const response = await handleAgentSpeak(
            state,
            messageText,
            currentHistory,
            otherResponses,
            false,
            topicDeviated && idx === 0 // 第一个智能体负责拉回话题
          );
          return response ? {
            agent: state.agent,
            text: response,
            index: idx,
          } : null;
        });

        const interactionResponses = (await Promise.all(interactionPromises))
          .filter((r): r is { agent: Agent; text: string; index: number } => r !== null);

        if (interactionResponses.length === 0) break;

        const interactionMessages: Message[] = interactionResponses.map(({ agent, text }) => ({
          id: generateMessageId(),
          sender: 'ai',
          text,
          agentId: agent.id,
          agentName: agent.name,
        }));

        setMessages(prev => [...prev, ...interactionMessages]);
        currentHistory = [...currentHistory, ...interactionMessages];

        // 更新智能体状态
        setAgentStates(prev => prev.map((state, idx) => {
          const responded = interactionResponses.find(r => r.index === idx);
          if (responded) {
            return {
              ...state,
              consecutiveCount: state.consecutiveCount + 1,
              lastSpokeIndex: currentHistory.length - 1,
            };
          } else {
            // 重置未发言智能体的连续计数
            return {
              ...state,
              consecutiveCount: 0,
            };
          }
        }));

        roundCount++;
        
        // 如果所有智能体都连续发言2次，停止
        if (agentStates.every(s => s.consecutiveCount >= 2)) break;
      }

      // 重置所有智能体的连续计数
      setAgentStates(prev => prev.map(state => ({
        ...state,
        consecutiveCount: 0,
      })));

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: generateMessageId(),
        sender: 'ai',
        text: '抱歉，对话过程中出现了问题。请稍后再试。',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(currentInput);
  };

  return (
    <div className="relative flex h-screen bg-[#F0F2F5] dark:bg-black overflow-hidden">
      <div className="flex flex-col w-full bg-white dark:bg-zinc-900 shadow-lg h-full min-h-0">
        <header className="flex items-center p-4 border-b dark:border-zinc-700 flex-shrink-0">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="ml-4 flex items-center gap-2">
            <span className="font-semibold text-lg dark:text-white">多智能体对话</span>
            <div className="flex gap-1">
              {agents.map(agent => (
                <img
                  key={agent.id}
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800"
                  title={agent.name}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className="flex flex-col items-center">
                  {msg.agentId && agents.find(a => a.id === msg.agentId) ? (
                    <>
                      <img
                        src={agents.find(a => a.id === msg.agentId)!.avatarUrl}
                        alt={msg.agentName || 'AI'}
                        className="w-8 h-8 rounded-full"
                      />
                      {msg.agentName && msg.agentName !== '系统' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {msg.agentName}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      {msg.agentName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {msg.agentName}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 dark:bg-zinc-700 dark:text-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sender === 'user' && (
                <img
                  src="https://picsum.photos/seed/user/40/40"
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm">智能体正在思考...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t dark:border-zinc-700 flex-shrink-0">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="输入问题，多个智能体将共同回答..."
              className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-black dark:bg-white dark:text-black text-white font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={isLoading || currentInput.trim() === ''}
            >
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MultiAgentChatPage;

