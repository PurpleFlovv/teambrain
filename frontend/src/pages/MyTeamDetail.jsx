import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeamEditor from '../components/TeamEditor';
import { ArrowLeft } from 'lucide-react';

const MyTeamDetail = () => {
  const { id } = useParams();
  const teamId = parseInt(id);
  const navigate = useNavigate();

  if (!teamId) return <div className="text-white p-6">无效的团队ID</div>;

  return (
    <TeamEditor
      teamId={teamId}
      isAdmin={false}
      breadcrumb={
        <div className="p-3 border-b border-white border-opacity-10 flex items-center space-x-2 text-sm">
          <button onClick={() => navigate('/my-teams')} className="text-blue-400 hover:underline flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>我的团队</span>
          </button>
        </div>
      }
    />
  );
};

export default MyTeamDetail;
