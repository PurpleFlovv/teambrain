import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TeamEditor from '../components/TeamEditor';
import { ArrowLeft } from 'lucide-react';

const TeamEditPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.pathname.match(/\/admin\/teams\/(\d+)\/edit/) || location.pathname.match(/\/teams\/(\d+)\/edit/);
  const teamId = match ? parseInt(match[1]) : null;

  if (!teamId) return <div className="text-white p-6">无效的团队ID</div>;

  return (
    <TeamEditor
      teamId={teamId}
      isAdmin={true}
      breadcrumb={
        <div className="p-3 border-b border-white border-opacity-10 flex items-center space-x-2 text-sm">
          <button onClick={() => navigate('/admin/teams')} className="text-blue-400 hover:underline flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>团队列表</span>
          </button>
          <span className="text-white opacity-40">/</span>
          <span className="text-white">编辑</span>
        </div>
      }
    />
  );
};

export default TeamEditPage;
