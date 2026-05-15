import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';
import BrainPointCloud from '../components/BrainPointCloud';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';

const MyTeamDetail = () => {
  const { id } = useParams();
  const teamId = parseInt(id);
  const navigate = useNavigate();
  const { regions, points: brainPoints } = useBrainData(teamId);
  const { team, nodes, connections: connRules } = useTeamData(teamId);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.get(`/teams/${teamId}/members`).then(r => setMembers(r.data)).catch(() => {});
  }, [teamId]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-[var(--glass-border)] flex items-center space-x-2 text-sm">
        <button onClick={() => navigate('/my-teams')} className="text-[var(--accent)] hover:underline flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>我的团队</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-[var(--glass-border)]">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{team?.teamName}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{team?.description}</p>
          <div className="mt-3 text-sm text-[var(--text-muted)]">
            <span>所有者：</span>
            <span className="text-[var(--text-primary)]">{members.find(m => m.isOwner)?.username || '—'}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">团队成员（{members.length}人）：</span>
            {members.map(m => (
              <span key={m.id} className="px-2 py-0.5 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)]">
                {m.username}{m.isOwner ? '（所有者）' : ''}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 relative">
          <BrainPointCloud brainPoints={brainPoints} regions={regions} team={team} nodes={nodes} connRules={connRules} onRefresh={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default MyTeamDetail;
