import React from 'react';
import { Agent } from '../types';
import EllipsisIcon from './icons/EllipsisIcon';

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  onOpenSettings: (agent: Agent) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, onOpenSettings }) => {
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenSettings(agent);
  };

  return (
    <div
      onClick={() => onSelect(agent)}
      className="relative bg-white/10 p-4 rounded-2xl cursor-pointer hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"
    >
      <button 
        onClick={handleSettingsClick}
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <EllipsisIcon className="w-5 h-5" />
      </button>

      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
            <img src={agent.avatarUrl} alt={agent.name} className="w-10 h-10 rounded-md object-cover" />
        </div>
      </div>
      <h3 className="font-bold text-white text-lg pr-8">{agent.name}</h3>
      <p className="text-gray-400 text-sm mb-4 truncate">{agent.description}</p>
      <div className="flex justify-between items-center">
        <span className="bg-white/10 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
          {agent.category}
        </span>
        <span className="text-gray-300 group-hover:translate-x-1 transition-transform duration-300">→</span>
      </div>
    </div>
  );
};

export default AgentCard;
