import React, { useState, useEffect } from 'react';
import BrainPointCloud from '../components/BrainPointCloud';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Index = () => {
  const { user } = useAuth();
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const { regions, points: brainPoints, loading: brainLoading } = useBrainData(activeTeamId);
  const { team, nodes, connections: connRules, loading: teamLoading, refresh } = useTeamData(activeTeamId);
  const [teamRegions, setTeamRegions] = useState([]);
  // Load available teams for switching
  useEffect(() => {
    api.get('/teams/public').then(r => setAllTeams(r.data)).catch(() => {});
  }, []);

  // Set initial active team
  useEffect(() => {
    if (allTeams.length === 0 || activeTeamId) return;
    const ids = user?.teamIds || [];
    const ownedId = user?.ownedTeamId;
    const firstOwned = ownedId && ids.includes(ownedId) ? ownedId : null;
    const firstJoined = ids.length > 0 ? ids[0] : null;
    const defaultId = firstOwned || firstJoined || 1;
    setActiveTeamId(defaultId);
  }, [allTeams, activeTeamId, user]);

  // Load active team's regions
  useEffect(() => {
    if (!activeTeamId) return;
    api.get(`/teams/${activeTeamId}/regions`).then(r => setTeamRegions(r.data)).catch(() => {});
  }, [activeTeamId]);

  // Reload team data when switching
  const switchTeam = (teamId) => {
    setActiveTeamId(parseInt(teamId));
  };

  if (brainLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[var(--bg-deep-space)]">
        <div className="text-[var(--text-muted)] text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Team switcher */}
      <div className="absolute top-4 right-4 z-10">
        <select value={activeTeamId || ''} onChange={e => switchTeam(e.target.value)}
          className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded px-3 py-1.5 text-[var(--text-primary)] text-sm">
          {allTeams.map(t => (
            <option key={t.id} value={t.id}>{t.teamName}{t.id === user?.ownedTeamId ? ' (我的)' : ''}</option>
          ))}
        </select>
      </div>

      <BrainPointCloud
        brainPoints={brainPoints}
        regions={teamRegions.length > 0 ? teamRegions : regions}
        team={team}
        nodes={nodes}
        connRules={connRules}
        onRefresh={refresh}
      />
    </div>
  );
};

export default Index;
