import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Agent } from '../../types';
import AgentCard from '../AgentCard';
import AppleLogoIcon from '../icons/AppleLogoIcon';
import SearchIcon from '../icons/SearchIcon';
import { createAgentProfile } from '../../services/geminiService';

interface ExplorerPageProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent, initialMessage?: string) => void;
  onAddAgent: (agent: Agent) => void;
  onUpdateAgent: (agent: Agent) => void;
  logoUrl: string | null;
  onLogoChange: (url: string) => void;
  onRestart: () => void;
}

const ExplorerPage: React.FC<ExplorerPageProps> = ({ agents, onSelectAgent, onAddAgent, onUpdateAgent, logoUrl, onLogoChange, onRestart }) => {
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
    <div className="bg-[#1C1C1E] min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Custom Logo" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <AppleLogoIcon className="h-6 w-6" />
            )}
            <h1 className="text-xl font-semibold">智能体</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSearchVisible(!isSearchVisible)} className="p-2 rounded-full hover:bg-white/10">
              <SearchIcon className="h-5 w-5" />
            </button>
            <input 
              type="file" 
              ref={logoInputRef} 
              onChange={handleLogoFileChange}
              className="hidden"
              accept="image/*"
            />
            <div className="relative" ref={userMenuRef}>
              <img 
                src="https://picsum.photos/seed/user/40/40" 
                alt="User" 
                className="h-8 w-8 rounded-full cursor-pointer"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
              />
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50">
                    <button
                        onClick={() => {
                            handleLogoUploadClick();
                            setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-600 transition-colors"
                    >
                        更换标志
                    </button>
                    <button
                        onClick={onRestart}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-600 transition-colors"
                    >
                        重新启动
                    </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="py-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">探索AI智能体</h2>
            <form onSubmit={handleQuickChatSubmit} className="mt-6 max-w-xl mx-auto">
              <input
                type="text"
                placeholder="与自定义智能体开始新的聊天..."
                value={quickChatInput}
                onChange={(e) => setQuickChatInput(e.target.value)}
                disabled={isCreatingAgent}
                className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-6 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {isCreatingAgent && <p className="text-sm text-purple-300 mt-2">正在创建您的新智能体...</p>}
            </form>
             {isSearchVisible && (
              <div className="mt-6 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="搜索智能体..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-full py-2 px-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-center mb-8 space-x-2">
            {categories.map(category => (
                <button 
                  key={category} 
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === category ? 'bg-white text-black' : 'bg-transparent hover:bg-white/10 text-white'}`}
                >
                    {category}
                </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categoryFilteredAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} onSelect={onSelectAgent} onOpenSettings={handleOpenSettings} />
            ))}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleCloseSettings}>
          <div className="bg-zinc-800 rounded-lg shadow-xl p-6 w-full max-w-lg text-white" onClick={(e) => e.stopPropagation()}>
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
              <button onClick={handleCloseSettings} className="px-4 py-2 rounded-md text-gray-200 bg-zinc-600 hover:bg-zinc-500 transition-colors">
                取消
              </button>
              <button onClick={handleSaveSettings} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorerPage;
