import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const linkClass = "px-3 py-2 text-white text-sm text-opacity-60 hover:text-opacity-100 transition-colors rounded";

  return (
    <div className="h-14 bg-black bg-opacity-80 backdrop-blur-sm border-b border-white border-opacity-10 flex items-center justify-between px-6 shrink-0">
      <button onClick={() => navigate('/')} className="text-white font-bold text-lg hover:opacity-80 transition-opacity">TeamBrain</button>
      <div className="flex items-center space-x-1">
        <button onClick={() => navigate('/my-teams')} className={linkClass}>我的团队</button>
        <button onClick={() => navigate('/teams')} className={linkClass}>团队广场</button>
        <button onClick={() => navigate('/profile')} className={linkClass}>个人信息</button>
        {user?.roles?.includes('ADMIN') && (
          <button onClick={() => navigate('/admin')} className={`${linkClass} border border-white border-opacity-20 ml-2`}>管理</button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
