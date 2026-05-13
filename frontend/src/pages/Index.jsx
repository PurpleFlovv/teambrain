import React from 'react';
import BrainPointCloud from '../components/BrainPointCloud';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';
import { useAuth } from '../context/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const { regions, points: brainPoints, loading: brainLoading } = useBrainData();
  const { team, nodes, connections: connRules, loading: teamLoading, refresh } = useTeamData();

  if (brainLoading || teamLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-black">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <BrainPointCloud
      brainPoints={brainPoints}
      regions={regions}
      team={team}
      nodes={nodes}
      connRules={connRules}
      onRefresh={refresh}
    />
  );
};

export default Index;
