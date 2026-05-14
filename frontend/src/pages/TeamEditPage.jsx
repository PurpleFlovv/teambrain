import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTeamData } from '../hooks/useTeamData';
import { useBrainData } from '../hooks/useBrainData';
import MiniBrain from '../components/MiniBrain';
import api from '../services/api';

const TeamEditPage = () => {
  const { id } = useParams();
  const teamId = parseInt(id);
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const { team, nodes, refresh } = useTeamData(teamId);
  const { regions, points: brainPoints } = useBrainData();
  const [teamName, setTeamName] = useState(team?.teamName || '');
  const [teamDesc, setTeamDesc] = useState(team?.description || '');
  const [nodeSearch, setNodeSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Sync team data when loaded
  React.useEffect(() => {
    if (team) { setTeamName(team.teamName || ''); setTeamDesc(team.description || ''); }
  }, [team]);

  const saveInfo = async () => {
    await api.put(`/admin/teams/${teamId}`, { teamName, description: teamDesc });
    refresh();
  };

  const handleDrop = async (nodeId, regionId) => {
    await api.put(`/api/nodes/${nodeId}/region`, { brainRegionId: regionId || null });
    refresh();
  };

  // Get team-specific regions
  const [teamRegions, setTeamRegions] = useState([]);
  React.useEffect(() => {
    api.get(`/teams/${teamId}/regions`).then(r => setTeamRegions(r.data)).catch(() => {});
  }, [teamId]);

  const filteredNodes = (nodes || []).filter(n => {
    const matchSearch = !nodeSearch || n.name.toLowerCase().includes(nodeSearch.toLowerCase());
    const matchRegion = !regionFilter || (n.brainRegionId && n.brainRegionId.toString() === regionFilter);
    return matchSearch && matchRegion;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="p-3 border-b border-white border-opacity-10 flex items-center space-x-2 text-sm">
        <button onClick={() => navigate('/admin/teams')} className="text-blue-400 hover:underline">← 团队列表</button>
        <span className="text-white opacity-40">/</span>
        <span className="text-white">{team?.teamName}</span>
        <span className="text-white opacity-40">/</span>
        <span className="text-white">编辑</span>
      </div>

      {/* Tabs - centered */}
      <div className="flex justify-center border-b border-white border-opacity-20">
        {[
          { key: 'info', label: '编辑信息' },
          { key: 'nodes', label: '编辑节点' },
          { key: 'import', label: '导入 JSON' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm transition-colors ${tab === t.key ? 'border-b-2 border-white text-white' : 'text-white text-opacity-60 hover:text-opacity-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {tab === 'info' && (
          <div className="max-w-lg mx-auto p-6 space-y-4">
            <div>
              <label className="block text-white text-sm mb-1">团队名称</label>
              <input value={teamName} onChange={e => setTeamName(e.target.value)}
                className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">描述</label>
              <textarea value={teamDesc} onChange={e => setTeamDesc(e.target.value)} rows={4}
                className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white" />
            </div>
            <button onClick={saveInfo} className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-6 py-2 rounded text-white">保存</button>
          </div>
        )}

        {tab === 'nodes' && (
          <div className="flex h-full">
            {/* Left: Node list */}
            <div className="w-1/2 border-r border-white border-opacity-10 p-4 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4">
                <input type="text" placeholder="搜索节点..." value={nodeSearch} onChange={e => setNodeSearch(e.target.value)}
                  className="flex-1 bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
                <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
                  className="bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-2 py-2 text-white text-sm">
                  <option value="">全部脑区</option>
                  {teamRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {filteredNodes.map(node => (
                  <div key={node.id} draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('nodeId', String(node.id));
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={e => { e.currentTarget.style.opacity = '1'; }}
                    className="flex items-center space-x-3 bg-black bg-opacity-20 border border-white border-opacity-10 rounded p-4 min-h-[56px] cursor-grab hover:border-white hover:border-opacity-30 transition-colors">
                    <span className="text-white text-opacity-40 cursor-grab select-none">⋮⋮</span>
                    <div className="flex-1">
                      <div className="text-white text-sm font-bold">{node.name}</div>
                      <div className="text-xs text-white text-opacity-50 mt-1">
                        {node.nodeType === 'MEMBER' ? '成员' : '项目'} · {node.brainRegionName || '未分配'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: Region list + MiniBrain toggle */}
            <div className="w-1/2 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">脑区列表</h3>
                <button className="text-xs text-blue-400 hover:underline">切换迷你大脑</button>
              </div>
              <div className="space-y-3">
                {teamRegions.map(region => (
                  <div key={region.id}
                    onDragOver={e => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = region.colorHex;
                      e.currentTarget.style.borderWidth = '2px';
                    }}
                    onDragLeave={e => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.borderWidth = '';
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      const nodeId = parseInt(e.dataTransfer.getData('nodeId'));
                      handleDrop(nodeId, region.id);
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.borderWidth = '';
                    }}
                    className="bg-black bg-opacity-20 border border-white border-opacity-10 rounded-lg p-4 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: region.colorHex }} />
                      <span className="text-white text-sm">{region.name}</span>
                      <span className="text-white text-opacity-40 text-xs ml-auto">
                        {(nodes || []).filter(n => n.brainRegionId === region.id).length} 节点
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'import' && (
          <div className="max-w-lg mx-auto p-6 space-y-4">
            <div className="border-2 border-dashed border-white border-opacity-30 rounded-lg p-8 text-center">
              <p className="text-white text-opacity-60 mb-4">上传 JSON 文件替换团队全部节点</p>
              <input type="file" accept=".json" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const data = JSON.parse(text);
                  // Clear existing and import new - simplified for now
                  console.log('Import data:', data);
                  alert('导入功能开发中');
                } catch { alert('JSON 格式错误'); }
              }} className="text-white" />
            </div>
            <div className="bg-black bg-opacity-30 p-4 rounded">
              <h3 className="text-white font-bold mb-2">格式说明</h3>
              <pre className="text-xs text-white text-opacity-60">{`{"0":[{"name":"Tim","description":"..."}],"1":[...]}`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamEditPage;
