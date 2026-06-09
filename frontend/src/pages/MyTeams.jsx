import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import PageShell from '../components/shared/PageShell';
import { Button } from '@/components/ui/button';
import api from '../services/api';

const MyTeams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teams/my')
      .then(r => setTeams(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell maxWidth="max-w-4xl" className="overflow-y-auto h-full scrollbar-glass">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">我的团队</h2>
        <div className="text-[var(--text-muted)] text-center py-12 animate-pulse">加载中...</div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="max-w-4xl" className="overflow-y-auto h-full scrollbar-glass">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">我的团队</h2>
      {teams.length === 0 ? (
        <div className="text-[var(--text-muted)] text-center py-12">
          <p className="mb-4">暂无团队</p>
          <Button onClick={() => navigate('/teams')}>浏览团队广场</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {teams.map(t => (
            <GlassCard
              key={t.id}
              onClick={() => navigate(`/my-teams/${t.id}`)}
              className="p-6 cursor-pointer hover:border-[var(--accent)]/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{t.teamName}</h3>
                {t.isOwner && <span className="text-xs text-[var(--accent)]">所有者</span>}
              </div>
              <p className="text-sm mb-4 text-[var(--text-muted)]">{t.description || '暂无描述'}</p>
              <div className="flex items-center space-x-4 text-xs text-[var(--text-muted)]">
                <span>{t.nodeCount || 0} 节点</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default MyTeams;
