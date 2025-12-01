import React, { useState } from 'react';
import AppleLogoIcon from '../icons/AppleLogoIcon';

interface LoginPageProps {
  onLoginSuccess: () => void;
  logoUrl: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, logoUrl }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isButtonDisabled = phoneNumber.trim() === '' || password.trim() === '' || !agreedToTerms;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isButtonDisabled) {
      onLoginSuccess();
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#111] text-white">
      {/* Left Pane */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        <div className="max-w-md text-center">
            {logoUrl ? (
                <img src={logoUrl} alt="Custom Logo" className="h-16 w-16 mx-auto mb-6 rounded-full object-cover" />
            ) : (
                <AppleLogoIcon className="h-16 w-16 mx-auto mb-6 text-white/80" />
            )}
            <h1 className="text-3xl font-bold tracking-tight">数字文娱IP角色塑造AI智能体平台</h1>
            <p className="mt-4 text-base text-white/70">
            提供智能体中台服务,创新“虚实共生”的数字文娱体验模式
            </p>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
            <a href="#" className="absolute top-6 right-8 text-white/60 hover:text-white transition-colors z-20 text-sm">
                企业注册
            </a>

            <div className="text-left mb-10">
                <h2 className="text-3xl font-bold text-white">登录账户</h2>
                <p className="text-gray-400 mt-2">输入您的手机号和密码即可开始。</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="手机号码"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isButtonDisabled}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400/50 disabled:cursor-not-allowed"
              >
                登录
              </button>
              <div className="mt-6 flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 bg-gray-700 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <label htmlFor="terms" className="ml-3 block text-sm text-gray-400">
                  同意服务条款
                </label>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;