import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('beauty@example.com');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        // Pass password to register
        await register(email, name, password);
      } else {
        // Pass password to login
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '登入失敗，請檢查您的帳號密碼。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-rose-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
            <Sparkles size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-stone-800">
            {isRegister ? '加入會員' : '歡迎回來'}
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            {isRegister ? '註冊以享受專屬優惠與服務' : '登入以查看您的訂單並享受會員專屬優惠'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-700 ml-1 mb-1">
                  姓名
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isRegister}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-200 placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="Your Name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 ml-1 mb-1">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-200 placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 ml-1 mb-1">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-200 placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center text-red-500 text-sm bg-red-50 p-3 rounded-lg animate-fade-in">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-stone-900 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all duration-300 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  {isRegister ? '立即註冊' : '登入'}
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center">
             <button
               type="button"
               onClick={() => {
                 setIsRegister(!isRegister);
                 setError('');
               }}
               className="text-sm font-medium text-rose-600 hover:text-rose-500"
             >
               {isRegister ? '已經有帳號？ 點此登入' : '還沒有帳號？ 點此註冊'}
             </button>
          </div>

          {!isRegister && (
            <div className="text-center text-xs text-stone-400">
              <p>提示：請輸入您註冊時的密碼</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;