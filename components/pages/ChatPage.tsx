import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, Message } from '../../types';
import { startChatSession, streamMessage, getSuggestedReplies, ChatSession } from '../../services/chatglmService';
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
  const chatSessionRef = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageRef = useRef(initialMessage);
  const messageIdCounterRef = useRef(0);
  
  // 生成唯一的消息 ID
  const generateMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return `msg-${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Update ref when initialMessage prop changes
  useEffect(() => {
    initialMessageRef.current = initialMessage;
  }, [initialMessage]);

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
        // Fetch suggested replies based on the new conversation history
        const newHistory = [...updated.filter(msg => msg.id !== aiMessageId && msg.id !== 'init'), newUserMessage, finalAiMessage];
        getSuggestedReplies(newHistory).then(replies => {
          setSuggestedReplies(replies);
        }).catch(err => {
          console.error("Error fetching suggested replies:", err);
        });
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

  useEffect(() => {
    // Reset state when agent changes
    setMessages([]);
    setSuggestedReplies([]);
    setCurrentInput('');
    setIsLoading(false);
    
    try {
      chatSessionRef.current = startChatSession(agent.systemPrompt);
      // Add an initial greeting message from the AI
      setMessages([{ id: 'init', sender: 'ai', text: `你好，我是${agent.name}。有什么可以帮你的吗？` }]);
      
      // Handle initial message if provided
      const initialMsg = initialMessageRef.current;
      if (initialMsg) {
        initialMessageRef.current = undefined; // Clear after first use
        // Use setTimeout to ensure chat session is initialized
        setTimeout(() => {
          handleSendMessage(initialMsg, true);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      setMessages([{ 
        id: 'init', 
        sender: 'ai', 
        text: `你好，我是${agent.name}。注意：需要启动Python后端服务并配置CHATGLM_API_KEY才能使用AI聊天功能。` 
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.id]); // Only re-run when agent changes

  return (
    <div className="relative flex h-screen bg-[#F0F2F5] dark:bg-black">
      <div className="flex flex-col w-full md:w-2/5 lg:w-1/3 bg-white dark:bg-zinc-900 shadow-lg">
        <header className="flex items-center p-4 border-b dark:border-zinc-700">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <span className="ml-4 font-semibold text-lg dark:text-white">聊天</span>
          <div className="ml-auto flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><SearchIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"><UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        
        <div className="p-4 border-t dark:border-zinc-700">
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
