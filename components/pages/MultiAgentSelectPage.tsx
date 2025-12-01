import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../../types';
import AgentCard from '../AgentCard';

interface MultiAgentSelectPageProps {
  agents: Agent[];
  onSelect: (selectedAgents: Agent[]) => void;
  onBack: () => void;
}

const MultiAgentSelectPage: React.FC<MultiAgentSelectPageProps> = ({ agents, onSelect, onBack }) => {
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);

  const handleAgentToggle = (agent: Agent) => {
    setSelectedAgents(prev => {
      const isSelected = prev.some(a => a.id === agent.id);
      if (isSelected) {
        return prev.filter(a => a.id !== agent.id);
      } else {
        if (prev.length >= 3) {
          alert('最多只能选择3个智能体');
          return prev;
        }
        return [...prev, agent];
      }
    });
  };

  const handleStartChat = () => {
    if (selectedAgents.length === 0) {
      alert('请至少选择一个智能体');
      return;
    }
    onSelect(selectedAgents);
  };

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <button 
            onClick={onBack}
            className="mb-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <motion.h1 
            className="text-4xl font-bold mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            多智能体对话
          </motion.h1>
          <motion.p 
            className="text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            选择最多3个智能体进行多角色对话
          </motion.p>
        </header>

        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            已选择 <span className="font-bold text-white">{selectedAgents.length}</span> / 3 个智能体
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {agents.map(agent => {
            const isSelected = selectedAgents.some(a => a.id === agent.id);
            return (
              <motion.div
                key={agent.id}
                onClick={() => handleAgentToggle(agent)}
                className={`relative cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1C1C1E]' 
                    : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AgentCard 
                  agent={agent} 
                  onSelect={() => {}} 
                  onOpenSettings={() => {}}
                  onDelete={() => {}}
                />
                {isSelected && (
                  <motion.div
                    className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <motion.button
            onClick={handleStartChat}
            disabled={selectedAgents.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
              selectedAgents.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={selectedAgents.length > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedAgents.length > 0 ? { scale: 0.95 } : {}}
          >
            开始对话 ({selectedAgents.length})
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default MultiAgentSelectPage;

