import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import GlassModal from '../components/shared/GlassModal';
import PageShell from '../components/shared/PageShell';
import { Button } from '@/components/ui/button';
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
    api.get(`/teams/${team.id}/regions`)
      .then(r => setSelected({ ...team, regions: r.data }))
      .catch(() => {});
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
    <PageShell maxWidth="max-w-5xl" className="overflow-y-auto h-full scrollbar-glass">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">团队广场</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {teams.map(t => (
          <GlassCard key={t.id} className="p-6">
            <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{t.teamName}</h3>
            <p className="text-sm mb-4 text-[var(--text-muted)] line-clamp-2">{t.description || '暂无描述'}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{t.ownerUsername}</span>
              {!(user?.teamIds || []).includes(t.id) && !joinedIds.has(t.id) ? (
                <Button size="sm" onClick={() => openDetail(t)}>加入</Button>
              ) : (
                <span className="text-xs text-[var(--success)]">已加入</span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {selected && (
        <GlassModal
          open={true}
          onOpenChange={() => setSelected(null)}
          title={selected.teamName}
          description={selected.description || '暂无描述'}
          className="sm:max-w-lg"
        >
          {selected.regions && (
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">脑区节点分布</h4>
              {selected.regions.map(r => (
                <div key={r.id} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorHex }} />
                  <span className="text-xs text-[var(--text-primary)]">{r.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setSelected(null)}>取消</Button>
            <Button onClick={() => handleJoin(selected)}>确认加入</Button>
          </div>
        </GlassModal>
      )}
    </PageShell>
  );
};

export default TeamSquare;
