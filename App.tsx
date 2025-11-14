import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [prevPage, setPrevPage] = useState<Page | null>(null);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeChat, setActiveChat] = useState<ChatState | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const navigateToExplorer = useCallback(() => {
    setPrevPage(currentPage);
    setCurrentPage(Page.EXPLORER);
  }, [currentPage]);

  const navigateToChat = useCallback((agent: Agent, initialMessage?: string) => {
    setPrevPage(currentPage);
    setActiveChat({ agent, initialMessage });
    setCurrentPage(Page.CHAT);
  }, [currentPage]);

  const navigateToExplorerFromChat = useCallback(() => {
    setPrevPage(currentPage);
    setActiveChat(null);
    setCurrentPage(Page.EXPLORER);
  }, [currentPage]);

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
    setPrevPage(currentPage);
    setCurrentPage(Page.LOGIN);
    setAgents(INITIAL_AGENTS);
    setActiveChat(null);
    setLogoUrl(null);
  }, [currentPage]);


  // 页面切换动画配置
  const pageVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 300 : -300,
      scale: 0.95,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -300 : 300,
      scale: 0.95,
    }),
  };

  const pageTransition = {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.4,
  };

  // 确定页面切换方向
  const getPageDirection = (page: Page): number => {
    const pageOrder = [Page.LOGIN, Page.EXPLORER, Page.CHAT];
    const prevIndex = prevPage !== null ? pageOrder.indexOf(prevPage) : -1;
    const nextIndex = pageOrder.indexOf(page);
    if (prevIndex === -1) return 1; // 首次加载，默认向右
    return nextIndex > prevIndex ? 1 : -1;
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.LOGIN:
        return (
          <motion.div
            key="login"
            custom={getPageDirection(Page.LOGIN)}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="absolute inset-0"
          >
            <LoginPage onLoginSuccess={navigateToExplorer} logoUrl={logoUrl} />
          </motion.div>
        );
      case Page.EXPLORER:
        return (
          <motion.div
            key="explorer"
            custom={getPageDirection(Page.EXPLORER)}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="absolute inset-0"
          >
            <ExplorerPage 
              agents={agents}
              onSelectAgent={navigateToChat} 
              onAddAgent={handleAddAgent}
              onUpdateAgent={handleUpdateAgent}
              logoUrl={logoUrl}
              onLogoChange={handleLogoChange}
              onRestart={handleRestart}
            />
          </motion.div>
        );
      case Page.CHAT:
        if (activeChat) {
          return (
            <motion.div
              key={`chat-${activeChat.agent.id}`}
              custom={getPageDirection(Page.CHAT)}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
              className="absolute inset-0"
            >
              <ChatPage 
                key={activeChat.agent.id}
                agent={activeChat.agent} 
                initialMessage={activeChat.initialMessage}
                onBack={navigateToExplorerFromChat} 
              />
            </motion.div>
          );
        }
        // Fallback to explorer if no agent is selected
        navigateToExplorer();
        return null;
      default:
        return (
          <motion.div
            key="login-default"
            custom={getPageDirection(Page.LOGIN)}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="absolute inset-0"
          >
            <LoginPage onLoginSuccess={navigateToExplorer} logoUrl={logoUrl} />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {renderPage()}
      </AnimatePresence>
    </div>
  );
};

export default App;