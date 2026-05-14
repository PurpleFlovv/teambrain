import React from 'react';
import { useParams } from 'react-router-dom';
import BrainPointCloud from '../components/BrainPointCloud';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';

const MyTeamDetail = () => {
  const { id } = useParams();
  const teamId = parseInt(id);
  const { regions, points: brainPoints, loading: brainLoading } = useBrainData(teamId);
  const { team, nodes, connections: connRules, loading: teamLoading, refresh } = useTeamData(teamId);

  if (brainLoading || teamLoading) {
    return <div className="flex items-center justify-center h-full text-white text-opacity-60">加载团队数据中...</div>;
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

export default MyTeamDetail;
