import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent } from '../../types';
import AgentCard from '../AgentCard';
import AppleLogoIcon from '../icons/AppleLogoIcon';
import SearchIcon from '../icons/SearchIcon';
import { createAgentProfile } from '../../services/chatglmService';

interface ExplorerPageProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent, initialMessage?: string) => void;
  onAddAgent: (agent: Agent) => void;
  onUpdateAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  logoUrl: string | null;
  onLogoChange: (url: string) => void;
  onRestart: () => void;
}

const ExplorerPage: React.FC<ExplorerPageProps> = ({ agents, onSelectAgent, onAddAgent, onUpdateAgent, onDeleteAgent, logoUrl, onLogoChange, onRestart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [quickChatInput, setQuickChatInput] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  
  // Settings Modal State
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [tempPrompt, setTempPrompt] = useState('');
  const [tempImageUrl, setTempImageUrl] = useState('');
  
  // User Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const filteredAgents = useMemo(() => {
    if (!searchTerm) return agents;
    return agents.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, agents]);
  
  const categories = useMemo(() => ['全部', ...new Set(agents.map(a => a.category))], [agents]);
  const [activeCategory, setActiveCategory] = useState('全部');
  
  const categoryFilteredAgents = useMemo(() => {
    if (activeCategory === '全部') return filteredAgents;
    return filteredAgents.filter(agent => agent.category === activeCategory);
  }, [activeCategory, filteredAgents]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleQuickChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickChatInput.trim()) return;

    setIsCreatingAgent(true);
    try {
      const profile = await createAgentProfile(quickChatInput);
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        ...profile,
        category: '新智能体',
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
        imageUrl: `https://picsum.photos/seed/${Date.now()}_bg/600/800`,
      };
      onAddAgent(newAgent);
      onSelectAgent(newAgent, quickChatInput);
      setQuickChatInput('');
    } catch (error) {
      console.error("Failed to create agent:", error);
    } finally {
      setIsCreatingAgent(false);
    }
  };
  
  const handleOpenSettings = (agent: Agent) => {
    setEditingAgent(agent);
    setTempPrompt(agent.systemPrompt);
    setTempImageUrl(agent.imageUrl);
  };
  
  const handleCloseSettings = () => {
    setEditingAgent(null);
  };
  
  const handleSaveSettings = () => {
    if (editingAgent) {
      onUpdateAgent({
        ...editingAgent,
        systemPrompt: tempPrompt,
        imageUrl: tempImageUrl,
        avatarUrl: tempImageUrl, // Sync avatar with the new background image
      });
      handleCloseSettings();
    }
  };

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newLogoUrl = URL.createObjectURL(file);
      onLogoChange(newLogoUrl);
    }
  };
  
  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newBgUrl = URL.createObjectURL(file);
      setTempImageUrl(newBgUrl);
    }
  };


  return (
    <div className="bg-[#1C1C1E] min-h-screen text-white relative overflow-hidden">
      {/* Subtle Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header 
          className="py-6 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            {logoUrl ? (
              <motion.img 
                src={logoUrl} 
                alt="Custom Logo" 
                className="h-8 w-8 rounded-full object-cover"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              />
            ) : (
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <AppleLogoIcon className="h-6 w-6" />
              </motion.div>
            )}
            <h1 className="text-xl font-semibold">智能体</h1>
          </motion.div>
          <div className="flex items-center space-x-4">
            <motion.button 
              onClick={() => setIsSearchVisible(!isSearchVisible)} 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <SearchIcon className="h-5 w-5" />
            </motion.button>
            <input 
              type="file" 
              ref={logoInputRef} 
              onChange={handleLogoFileChange}
              className="hidden"
              accept="image/*"
            />
            <div className="relative" ref={userMenuRef}>
              <motion.img 
                src="https://picsum.photos/seed/user/40/40" 
                alt="User" 
                className="h-8 w-8 rounded-full cursor-pointer"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              />
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                      <motion.button
                          onClick={() => {
                              handleLogoUploadClick();
                              setIsUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-600 transition-colors"
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                      >
                          更换标志
                      </motion.button>
                      <motion.button
                          onClick={onRestart}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-600 transition-colors"
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                      >
                          重新启动
                      </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        <main className="py-10">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              探索AI智能体
            </motion.h2>
            <motion.form 
              onSubmit={handleQuickChatSubmit} 
              className="mt-6 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
              >
                <motion.input
                  type="text"
                  placeholder="与自定义智能体开始新的聊天..."
                  value={quickChatInput}
                  onChange={(e) => setQuickChatInput(e.target.value)}
                  disabled={isCreatingAgent}
                  className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-6 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                />
                {quickChatInput && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </motion.div>
              <AnimatePresence>
                {isCreatingAgent && (
                  <motion.p 
                    className="text-sm text-purple-300 mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    正在创建您的新智能体...
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.form>
            <AnimatePresence>
             {isSearchVisible && (
              <motion.div 
                className="mt-6 max-w-md mx-auto"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.input
                  type="text"
                  placeholder="搜索智能体..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-full py-2 px-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                />
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div 
            className="flex justify-center mb-8 space-x-2 flex-wrap gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {categories.map((category, index) => (
                <motion.button 
                  key={category} 
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === category 
                      ? 'bg-white text-black shadow-lg shadow-purple-500/50' 
                      : 'bg-transparent hover:bg-white/10 text-white'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                    {category}
                </motion.button>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoryFilteredAgents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onSelect={onSelectAgent} 
                onOpenSettings={handleOpenSettings}
                onDelete={onDeleteAgent}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {editingAgent && (
          <motion.div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" 
            onClick={handleCloseSettings}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-zinc-800 rounded-lg shadow-xl p-6 w-full max-w-lg text-white" 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4">编辑智能体: {editingAgent.name}</h2>
            <div className="mb-4">
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-300 mb-2">系统提示</label>
              <textarea
                id="systemPrompt"
                rows={6}
                className="w-full p-2 border border-zinc-600 rounded-md bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tempPrompt}
                onChange={(e) => setTempPrompt(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">聊天背景图片</label>
              <input
                  type="file"
                  id="imageUrl"
                  className="hidden"
                  accept="image/*"
                  onChange={handleBgFileChange}
              />
              <div className="flex items-center gap-4">
                  <label htmlFor="imageUrl" className="cursor-pointer px-4 py-2 rounded-md text-white bg-zinc-600 hover:bg-zinc-500 transition-colors">
                      上传图片
                  </label>
                  {tempImageUrl && (
                      <img src={tempImageUrl} alt="Background Preview" className="w-20 h-12 object-cover rounded-md border border-zinc-600" />
                  )}
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <motion.button 
                onClick={handleCloseSettings} 
                className="px-4 py-2 rounded-md text-gray-200 bg-zinc-600 hover:bg-zinc-500 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                取消
              </motion.button>
              <motion.button 
                onClick={handleSaveSettings} 
                className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                保存更改
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExplorerPage;