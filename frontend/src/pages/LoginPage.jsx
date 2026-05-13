import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(username, password, email);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="bg-black bg-opacity-30 backdrop-blur-md border border-white border-opacity-20 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {isRegister ? '注册 TeamBrain' : '登录 TeamBrain'}
        </h1>
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded p-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-1">用户名</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          {isRegister && (
            <div>
              <label className="block text-white text-sm mb-1">邮箱</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-white text-sm mb-1">密码</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white"
              required
            />
          </div>
          <button type="submit"
            className="w-full bg-blue-500 bg-opacity-50 hover:bg-opacity-70 rounded py-2 text-white font-bold">
            {isRegister ? '注册' : '登录'}
          </button>
        </form>
        <p className="text-white text-sm mt-4 text-center opacity-60 cursor-pointer"
           onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
