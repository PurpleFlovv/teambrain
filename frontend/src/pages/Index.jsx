import React, { useState, useEffect } from 'react';
import BrainPointCloud from '../components/BrainPointCloud';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Index = () => {
  const { user } = useAuth();
  const { regions, points: brainPoints, loading: brainLoading } = useBrainData(user?.teamId);
  const { team, nodes, connections: connRules, loading: teamLoading, refresh } = useTeamData();
  const [teamRegions, setTeamRegions] = useState([]);

  useEffect(() => {
    if (!user?.teamId) return;
    api.get(`/teams/${user.teamId}/regions`).then(r => setTeamRegions(r.data)).catch(() => {});
  }, [user?.teamId]);

  if (brainLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[var(--bg-deep-space)]">
        <div className="text-[var(--text-muted)] text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <BrainPointCloud
      brainPoints={brainPoints}
      regions={teamRegions.length > 0 ? teamRegions : regions}
      team={team}
      nodes={nodes}
      connRules={connRules}
      onRefresh={refresh}
    />
  );
};

export default Index;
