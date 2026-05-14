import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const JoinTeam = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    api.get('/admin/teams').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-2">选择团队</h2>
      <p className="text-white text-opacity-60 text-sm mb-6">选择一个团队加入，开始使用 TeamBrain</p>
      <div className="grid grid-cols-2 gap-4">
        {teams.map(t => (
          <div key={t.id} className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-6">
            <h3 className="text-white font-bold text-lg mb-2">{t.teamName}</h3>
            <p className="text-white text-opacity-60 text-sm mb-4">{t.description || '暂无描述'}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-white text-opacity-40 text-xs">
                <span>👥 {t.memberCount || 0}</span>
                <span>📦 {t.projectCount || 0}</span>
              </div>
              <button onClick={async () => {
                await api.post(`/teams/${t.id}/join`);
                navigate('/');
              }} className="bg-green-500 bg-opacity-50 hover:bg-opacity-70 px-4 py-1.5 rounded text-white text-sm">
                加入团队
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinTeam;
