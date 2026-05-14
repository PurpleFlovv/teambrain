import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TeamSquare = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    api.get('/teams/public').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  const openDetail = (team) => {
    // Fetch team regions for distribution display
    api.get(`/teams/${team.id}/regions`).then(r => {
      setSelected({ ...team, regions: r.data });
    }).catch(() => {});
  };

  const handleJoin = async (team) => {
    try {
      await api.post(`/teams/${team.id}/join`);
      setJoinedIds(prev => new Set([...prev, team.id]));
      setSelected(null);
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">团队广场</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {teams.map(t => (
          <div key={t.id} className="bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-6">
            <h3 className="text-white font-bold text-lg mb-2">{t.teamName}</h3>
            <p className="text-white text-opacity-60 text-sm mb-4 line-clamp-2">{t.description || '暂无描述'}</p>
            <div className="flex items-center justify-between">
              <span className="text-white text-opacity-40 text-xs">{t.ownerUsername}</span>
              {t.id !== user?.teamId && !joinedIds.has(t.id) ? (
                <button onClick={() => openDetail(t)}
                  className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-3 py-1 rounded text-white text-xs">
                  加入
                </button>
              ) : (
                <span className="text-green-400 text-xs">已加入</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Team detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-black bg-opacity-90 backdrop-blur-md border border-white border-opacity-20 rounded-lg p-6 w-[480px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-white font-bold text-xl mb-2">{selected.teamName}</h3>
            <p className="text-white text-opacity-60 text-sm mb-6">{selected.description || '暂无描述'}</p>
            {selected.regions && (
              <div className="space-y-2 mb-6">
                <h4 className="text-white text-sm font-bold mb-3">脑区节点分布</h4>
                {selected.regions.map(r => (
                  <div key={r.id} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorHex }} />
                    <span className="text-white text-xs">{r.name}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded text-white text-sm bg-gray-500 bg-opacity-50">取消</button>
              <button onClick={() => handleJoin(selected)} className="px-4 py-2 rounded text-white text-sm bg-blue-500 bg-opacity-50">确认加入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSquare;
