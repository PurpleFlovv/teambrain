import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MyTeams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    api.get('/teams/public').then(r => {
      // Show teams owned by current user (simplified: all teams for now)
      setTeams(r.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">我的团队</h2>
      {teams.length === 0 ? (
        <div className="text-white text-opacity-60 text-center py-12">
          <p className="mb-4">暂无团队</p>
          <button onClick={() => navigate('/teams')} className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-4 py-2 rounded text-white text-sm">
            浏览团队广场
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {teams.map(t => (
            <div key={t.id} onClick={() => navigate(`/my-teams/${t.id}`)}
              className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-6 cursor-pointer hover:border-white hover:border-opacity-40 transition-all">
              <h3 className="text-white font-bold text-lg mb-2">{t.teamName}</h3>
              <p className="text-white text-opacity-60 text-sm mb-4">{t.description || '暂无描述'}</p>
              <div className="flex items-center space-x-4 text-white text-opacity-40 text-xs">
                <span>👥 {t.memberCount} 成员</span>
                <span>📦 {t.projectCount} 项目</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
