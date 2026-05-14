import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await api.put(`/admin/users/${user.id}`, { email, password: password || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">个人信息</h2>
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-white text-sm mb-1">用户名</label>
          <input value={user?.username || ''} disabled
            className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white opacity-50 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-white text-sm mb-1">邮箱</label>
          <input value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-white text-sm mb-1">新密码（留空不修改）</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white" />
        </div>
        <div className="flex justify-between pt-2">
          <button onClick={logout} className="px-4 py-2 rounded text-white text-sm bg-red-500 bg-opacity-50 hover:bg-opacity-70">退出登录</button>
          <button onClick={handleSave} className="px-4 py-2 rounded text-white text-sm bg-blue-500 bg-opacity-50 hover:bg-opacity-70">
            {saved ? '已保存' : '保存'}
          </button>
        </div>
        <p className="text-white text-opacity-40 text-xs">角色：{(user?.roles || []).join(', ')}</p>
      </div>
    </div>
  );
};

export default Profile;
