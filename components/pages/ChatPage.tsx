import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent, Message } from '../../types';
import { startChatSession, streamMessage, getSuggestedReplies, ChatSession } from '../../services/chatglmService';
import { getChatHistories, saveChatHistory, createChatHistory, deleteChatHistory, ChatHistory } from '../../services/chatHistory';
import SearchIcon from '../icons/SearchIcon';
import UserIcon from '../icons/UserIcon';

interface ChatPageProps {
  agent: Agent;
  onBack: () => void;
  initialMessage?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ agent, onBack, initialMessage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const chatSessionRef = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageRef = useRef(initialMessage);
  const messageIdCounterRef = useRef(0);
  const initializedAgentIdRef = useRef<string | null>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);
  const currentHistoryRef = useRef<ChatHistory | null>(null);
  
  // 生成唯一的消息 ID
  const generateMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return `msg-${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Update ref when initialMessage prop changes
  useEffect(() => {
    initialMessageRef.current = initialMessage;
  }, [initialMessage]);

  // 加载历史记录列表
  useEffect(() => {
    const histories = getChatHistories(agent.id);
    setChatHistories(histories);
  }, [agent.id]);

  // 点击外部关闭历史记录菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyMenuRef.current && !historyMenuRef.current.contains(event.target as Node)) {
        setIsHistoryMenuOpen(false);
      }
    };

    if (isHistoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHistoryMenuOpen]);

  // 保存当前对话到历史记录
  useEffect(() => {
    // 只在有实际对话内容时保存（排除初始问候消息）
    const userMessages = messages.filter(m => m.sender === 'user');
    if (userMessages.length > 0 && messages.length > 1) {
      if (currentHistoryRef.current) {
        // 更新现有历史记录
        currentHistoryRef.current.messages = messages;
        currentHistoryRef.current.updatedAt = Date.now();
        saveChatHistory(currentHistoryRef.current);
      } else if (currentHistoryId) {
        // 更新已加载的历史记录
        const history = chatHistories.find(h => h.id === currentHistoryId);
        if (history) {
          history.messages = messages;
          history.updatedAt = Date.now();
          saveChatHistory(history);
        }
      } else {
        // 创建新历史记录
        const newHistory = createChatHistory(agent.id, messages);
        currentHistoryRef.current = newHistory;
        setCurrentHistoryId(newHistory.id);
        saveChatHistory(newHistory);
        // 更新历史记录列表
        setChatHistories(prev => [newHistory, ...prev]);
      }
    }
  }, [messages, agent.id, currentHistoryId, chatHistories]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSendMessage = async (messageText: string, isInitial = false) => {
    if (messageText.trim() === '' || isLoading || !chatSessionRef.current) return;

    setIsLoading(true);
    setSuggestedReplies([]);
    const newUserMessage: Message = { id: generateMessageId(), sender: 'user', text: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    
    if (!isInitial) {
        setCurrentInput('');
    }

    try {
      const stream = await streamMessage(chatSessionRef.current, messageText);
      
      let aiResponseText = '';
      const aiMessageId = generateMessageId();
      
      // Add a placeholder for the AI response
      setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '...' }]);

      for await (const chunk of stream) {
        aiResponseText += chunk.text;
        // Update the placeholder with streamed text
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: aiResponseText } : msg));
      }
      
      const finalAiMessage: Message = { id: aiMessageId, sender: 'ai', text: aiResponseText };
      setMessages(prev => {
        const updated = prev.map(msg => msg.id === aiMessageId ? finalAiMessage : msg);
        // 禁用建议回复功能以提升响应速度
        // 如需启用，取消下面的注释
        /*
        setTimeout(() => {
          const newHistory = [...updated.filter(msg => msg.id !== aiMessageId && msg.id !== 'init'), newUserMessage, finalAiMessage];
          getSuggestedReplies(newHistory).then(replies => {
            setSuggestedReplies(replies);
          }).catch(err => {
            console.error("Error fetching suggested replies:", err);
          });
        }, 100);
        */
        return updated;
      });

    } catch (error)
 {
      console.error("Failed to send message:", error);
      const errorMessage: Message = { id: generateMessageId(), sender: 'ai', text: '抱歉，我好像遇到了一些问题。请稍后再试。' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(currentInput);
  };

  const handleSuggestedReplyClick = (reply: string) => {
    handleSendMessage(reply);
  };

  // 加载历史记录
  const handleLoadHistory = (history: ChatHistory) => {
    setMessages(history.messages);
    setCurrentHistoryId(history.id);
    currentHistoryRef.current = history;
    setIsHistoryMenuOpen(false);
    
    // 重新初始化聊天会话
    try {
      chatSessionRef.current = startChatSession(agent.systemPrompt);
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
    }
  };

  // 创建新对话
  const handleNewChat = () => {
    setMessages([]);
    setCurrentHistoryId(null);
    currentHistoryRef.current = null;
    setIsHistoryMenuOpen(false);
    
    // 重新初始化聊天会话
    try {
      chatSessionRef.current = startChatSession(agent.systemPrompt);
      const initMessage = { id: 'init', sender: 'ai' as const, text: `你好，我是${agent.name}。有什么可以帮你的吗？` };
      setMessages([initMessage]);
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      setMessages([{ 
        id: 'init', 
        sender: 'ai' as const, 
        text: `你好，我是${agent.name}。注意：需要启动Python后端服务并配置CHATGLM_API_KEY才能使用AI聊天功能。` 
      }]);
    }
  };

  // 删除历史记录
  const handleDeleteHistory = (historyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条历史记录吗？')) {
      deleteChatHistory(agent.id, historyId);
      setChatHistories(prev => prev.filter(h => h.id !== historyId));
      
      // 如果删除的是当前查看的历史记录，创建新对话
      if (currentHistoryId === historyId) {
        handleNewChat();
      }
    }
  };

  useEffect(() => {
    // Skip if this agent is already initialized
    if (initializedAgentIdRef.current === agent.id) {
      return;
    }
    
    // Mark this agent as initialized
    initializedAgentIdRef.current = agent.id;
    
    // Reset state when agent changes - 每次进入都创建新对话
    setMessages([]);
    setSuggestedReplies([]);
    setCurrentInput('');
    setIsLoading(false);
    setCurrentHistoryId(null);
    currentHistoryRef.current = null;
    
    // 重新加载历史记录列表
    const histories = getChatHistories(agent.id);
    setChatHistories(histories);
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      chatSessionRef.current = startChatSession(agent.systemPrompt);
      // Add an initial greeting message from the AI
      const initMessage = { id: 'init', sender: 'ai' as const, text: `你好，我是${agent.name}。有什么可以帮你的吗？` };
      setMessages([initMessage]);
      
      // Handle initial message if provided
      const initialMsg = initialMessageRef.current;
      if (initialMsg) {
        initialMessageRef.current = undefined; // Clear after first use
        // Use setTimeout to ensure chat session is initialized
        timeoutId = setTimeout(() => {
          if (chatSessionRef.current && initializedAgentIdRef.current === agent.id) {
            handleSendMessage(initialMsg, true);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      setMessages([{ 
        id: 'init', 
        sender: 'ai' as const, 
        text: `你好，我是${agent.name}。注意：需要启动Python后端服务并配置CHATGLM_API_KEY才能使用AI聊天功能。` 
      }]);
    }
    
    // Cleanup function to reset flag and clear timeout when agent changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (initializedAgentIdRef.current === agent.id) {
        initializedAgentIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]); // Only re-run when agent changes

  // 组件卸载时保存当前对话
  useEffect(() => {
    return () => {
      const userMessages = messages.filter(m => m.sender === 'user');
      if (userMessages.length > 0 && messages.length > 1) {
        if (currentHistoryRef.current) {
          currentHistoryRef.current.messages = messages;
          currentHistoryRef.current.updatedAt = Date.now();
          saveChatHistory(currentHistoryRef.current);
        } else if (currentHistoryId) {
          const history = chatHistories.find(h => h.id === currentHistoryId);
          if (history) {
            history.messages = messages;
            history.updatedAt = Date.now();
            saveChatHistory(history);
          }
        } else {
          const newHistory = createChatHistory(agent.id, messages);
          saveChatHistory(newHistory);
        }
      }
    };
  }, [messages, agent.id, currentHistoryId, chatHistories]);

  return (
    <div className="relative flex h-screen bg-[#F0F2F5] dark:bg-black overflow-hidden">
      <div className="flex flex-col w-full md:w-2/5 lg:w-1/3 bg-white dark:bg-zinc-900 shadow-lg h-full min-h-0">
        <header className="flex items-center p-4 border-b dark:border-zinc-700 flex-shrink-0">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <span className="ml-4 font-semibold text-lg dark:text-white">聊天</span>
          <div className="ml-auto flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><SearchIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
              <div className="relative" ref={historyMenuRef}>
                <button 
                  onClick={() => setIsHistoryMenuOpen(!isHistoryMenuOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <AnimatePresence>
                  {isHistoryMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-hidden flex flex-col"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 py-2 border-b dark:border-zinc-700 flex items-center justify-between">
                        <h3 className="font-semibold text-sm dark:text-white">历史记录</h3>
                        <button
                          onClick={handleNewChat}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          新建对话
                        </button>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {chatHistories.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                            暂无历史记录
                          </div>
                        ) : (
                          chatHistories.map((history) => (
                            <div
                              key={history.id}
                              className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer group relative ${
                                currentHistoryId === history.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                              onClick={() => handleLoadHistory(history)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {history.title || '新对话'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(history.updatedAt).toLocaleString('zh-CN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => handleDeleteHistory(history.id, e)}
                                  className="ml-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-opacity"
                                  title="删除"
                                >
                                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && <img src={agent.avatarUrl} alt="AI Avatar" className="w-8 h-8 rounded-full" />}
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-zinc-700 dark:text-gray-200 text-gray-800 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
               {msg.sender === 'user' && <img src="https://picsum.photos/seed/user/40/40" alt="User Avatar" className="w-8 h-8 rounded-full" />}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t dark:border-zinc-700 flex-shrink-0">
            {suggestedReplies.length > 0 && (
                <div className="mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">建议回复</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedReplies.map((reply) => (
                            <button key={`reply-${reply}`} onClick={() => handleSuggestedReplyClick(reply)} className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 dark:text-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors">
                                {reply}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="输入文本..."
                  className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  disabled={isLoading}
                />
                <button type="submit" className="px-4 py-2 bg-black dark:bg-white dark:text-black text-white font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50" disabled={isLoading || currentInput.trim() === ''}>
                    发送
                </button>
            </form>
        </div>
      </div>
      <div className="hidden md:block md:w-3/5 lg:w-2/3 h-full">
        <img src={agent.imageUrl} alt={agent.name} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default ChatPage;
