import React, { useState, useCallback } from 'react';
import { Page, Agent } from './types';
import LoginPage from './components/pages/LoginPage';
import ExplorerPage from './components/pages/ExplorerPage';
import ChatPage from './components/pages/ChatPage';
import { INITIAL_AGENTS } from './constants';

interface ChatState {
  agent: Agent;
  initialMessage?: string;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeChat, setActiveChat] = useState<ChatState | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const navigateToExplorer = useCallback(() => {
    setCurrentPage(Page.EXPLORER);
  }, []);

  const navigateToChat = useCallback((agent: Agent, initialMessage?: string) => {
    setActiveChat({ agent, initialMessage });
    setCurrentPage(Page.CHAT);
  }, []);

  const navigateToExplorerFromChat = useCallback(() => {
    setActiveChat(null);
    setCurrentPage(Page.EXPLORER);
  }, []);

  const handleAddAgent = useCallback((newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev]);
  }, []);
  
  const handleUpdateAgent = useCallback((updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => agent.id === updatedAgent.id ? updatedAgent : agent));
  }, []);

  const handleLogoChange = useCallback((url: string) => {
    setLogoUrl(url);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentPage(Page.LOGIN);
    setAgents(INITIAL_AGENTS);
    setActiveChat(null);
    setLogoUrl(null);
  }, []);


  const renderPage = () => {
    switch (currentPage) {
      case Page.LOGIN:
        return <LoginPage onLoginSuccess={navigateToExplorer} logoUrl={logoUrl} />;
      case Page.EXPLORER:
        return (
          <ExplorerPage 
            agents={agents}
            onSelectAgent={navigateToChat} 
            onAddAgent={handleAddAgent}
            onUpdateAgent={handleUpdateAgent}
            logoUrl={logoUrl}
            onLogoChange={handleLogoChange}
            onRestart={handleRestart}
          />
        );
      case Page.CHAT:
        if (activeChat) {
          return (
            <ChatPage 
              key={activeChat.agent.id}
              agent={activeChat.agent} 
              initialMessage={activeChat.initialMessage}
              onBack={navigateToExplorerFromChat} 
            />
          );
        }
        // Fallback to explorer if no agent is selected
        navigateToExplorer();
        return null;
      default:
        return <LoginPage onLoginSuccess={navigateToExplorer} logoUrl={logoUrl} />;
    }
  };

  return <div className="min-h-screen bg-white dark:bg-black">{renderPage()}</div>;
};

export default App;