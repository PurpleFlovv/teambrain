import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import PageShell from '../components/shared/PageShell';
import { Button } from '@/components/ui/button';
import api from '../services/api';

const JoinTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    api.get('/teams/public').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  const handleJoin = async (t) => {
    try {
      await api.post(`/teams/${t.id}/join`);
      setJoinedIds(prev => new Set([...prev, t.id]));
      navigate('/');
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  return (
    <PageShell maxWidth="max-w-4xl">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">选择团队</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">选择一个团队加入，开始使用 TeamBrain</p>
      <div className="grid grid-cols-2 gap-4">
        {teams.map(t => (
          <GlassCard key={t.id} className="p-6">
            <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{t.teamName}</h3>
            <p className="text-sm mb-4 text-[var(--text-muted)]">{t.description || '暂无描述'}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-[var(--text-muted)]">
                <span>{t.memberCount || 0} 成员</span>
                <span>{t.projectCount || 0} 项目</span>
              </div>
              {!(user?.teamIds || []).includes(t.id) && !joinedIds.has(t.id) ? (
                <Button size="sm" onClick={() => handleJoin(t)}>加入团队</Button>
              ) : (
                <span className="text-xs text-[var(--success)]">已加入</span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
};

export default JoinTeam;
