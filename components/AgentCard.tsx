import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../types';
import EllipsisIcon from './icons/EllipsisIcon';

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  onOpenSettings: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, onOpenSettings, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onOpenSettings(agent);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm(`确定要删除智能体 "${agent.name}" 吗？`)) {
      onDelete(agent.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(agent)}
      className="relative bg-white/10 p-4 rounded-2xl cursor-pointer hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"
    >
      <div className="absolute top-4 right-4" ref={menuRef}>
        <button 
          onClick={handleSettingsClick}
          className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors relative z-10"
        >
          <EllipsisIcon className="w-5 h-5" />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50">
            <button
              onClick={handleEdit}
              className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-zinc-600 transition-colors"
            >
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-600 transition-colors"
            >
              删除
            </button>
          </div>
        )}
      </div>

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
