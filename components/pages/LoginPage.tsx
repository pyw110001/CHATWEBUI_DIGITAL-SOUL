import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppleLogoIcon from '../icons/AppleLogoIcon';

interface LoginPageProps {
  onLoginSuccess: () => void;
  logoUrl: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, logoUrl }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const isButtonDisabled = phoneNumber.trim() === '' || password.trim() === '' || !agreedToTerms;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isButtonDisabled) {
      onLoginSuccess();
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#111] text-white relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            initial={{
              x: Math.random() * dimensions.width,
              y: Math.random() * dimensions.height,
            }}
            animate={{
              y: [null, Math.random() * dimensions.height],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Left Pane */}
      <motion.div 
        className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Base Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
        
        {/* Animated Color Transition Layer 1 - Purple Dominant */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-600/50 via-purple-700/50 to-purple-800/50"
          animate={{
            opacity: [0.7, 0.3, 0.1, 0.3, 0.7],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Animated Color Transition Layer 2 - Blue-Purple Dominant */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 via-indigo-700/50 to-indigo-800/50"
          animate={{
            opacity: [0.2, 0.7, 0.4, 0.7, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Animated Color Transition Layer 3 - Deep Blue Dominant */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-blue-800/50 to-indigo-900/50"
          animate={{
            opacity: [0.1, 0.3, 0.7, 0.3, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Additional Smooth Transition Layer - Blue-Purple Blend */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-purple-600/40 to-blue-700/40"
          animate={{
            opacity: [0.3, 0.6, 0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
            delay: 3.75,
          }}
        />
        
        {/* Floating Orbs with Color Animation */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
            backgroundColor: [
              'rgba(139, 92, 246, 0.15)', // 紫色
              'rgba(99, 102, 241, 0.15)', // 蓝紫色
              'rgba(30, 58, 138, 0.15)',  // 深蓝色
              'rgba(99, 102, 241, 0.15)', // 蓝紫色
              'rgba(139, 92, 246, 0.15)', // 紫色
            ],
          }}
          transition={{
            x: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            backgroundColor: { duration: 15, repeat: Infinity, ease: 'linear' },
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
            backgroundColor: [
              'rgba(99, 102, 241, 0.15)', // 蓝紫色
              'rgba(30, 58, 138, 0.15)',  // 深蓝色
              'rgba(139, 92, 246, 0.15)', // 紫色
              'rgba(99, 102, 241, 0.15)', // 蓝紫色
              'rgba(99, 102, 241, 0.15)', // 蓝紫色
            ],
          }}
          transition={{
            x: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            backgroundColor: { duration: 15, repeat: Infinity, ease: 'linear', delay: 7.5 },
          }}
        />

        <motion.div 
          className="max-w-md text-center relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
            {logoUrl ? (
                <motion.img 
                  src={logoUrl} 
                  alt="Custom Logo" 
                  className="h-16 w-16 mx-auto mb-6 rounded-full object-cover"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
            ) : (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <AppleLogoIcon className="h-16 w-16 mx-auto mb-6 text-white/80" />
                </motion.div>
            )}
            <motion.h1 
              className="text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              数字文娱IP角色塑造AI智能体平台
            </motion.h1>
            <motion.p 
              className="mt-4 text-base text-white/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              提供智能体中台服务,创新"虚实共生"的数字文娱体验模式
            </motion.p>
        </motion.div>
      </motion.div>

      {/* Right Pane - Login Form */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-sm">
            <motion.a 
              href="#" 
              className="absolute top-6 right-8 text-white/60 hover:text-white transition-colors z-20 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
                企业注册
            </motion.a>

            <motion.div 
              className="text-left mb-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
                <h2 className="text-3xl font-bold text-white">登录账户</h2>
                <p className="text-gray-400 mt-2">输入您的手机号和密码即可开始。</p>
            </motion.div>

            <form onSubmit={handleLogin}>
              <motion.div 
                className="mb-4 relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <motion.input
                  type="text"
                  placeholder="手机号码"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </motion.div>
              <motion.div 
                className="mb-4 relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                <motion.input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </motion.div>
              <motion.button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400/50 disabled:cursor-not-allowed relative overflow-hidden"
                whileHover={!isButtonDisabled ? { scale: 1.02 } : {}}
                whileTap={!isButtonDisabled ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {!isButtonDisabled && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-100 transition-opacity"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />
                )}
                <span className="relative z-10">登录</span>
              </motion.button>
              <motion.div 
                className="mt-6 flex items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <motion.input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 bg-gray-700 text-blue-600 focus:ring-blue-500 border-gray-600 rounded cursor-pointer"
                  whileTap={{ scale: 0.9 }}
                />
                <label htmlFor="terms" className="ml-3 block text-sm text-gray-400 cursor-pointer">
                  同意服务条款
                </label>
              </motion.div>
            </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;