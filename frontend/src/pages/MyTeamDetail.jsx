import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Settings } from 'lucide-react';
import api from '../services/api';

const MyTeamDetail = () => {
  const { id } = useParams();
  const teamId = parseInt(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [team, setTeam] = useState(null);
  const isOwner = user?.ownedTeamId === teamId || user?.roles?.includes('ADMIN');

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(r => setTeam(r.data)).catch(() => {});
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
          {isOwner && (
            <div className="mt-3">
              <button onClick={() => navigate(`/admin/teams/${teamId}/edit`)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors">
                <Settings className="w-4 h-4" />
                <span>编辑团队</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTeamDetail;
