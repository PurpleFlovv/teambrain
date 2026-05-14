import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeamData } from '../hooks/useTeamData';
import { useBrainData } from '../hooks/useBrainData';
import MiniBrain from '../components/MiniBrain';
import api from '../services/api';

const TABS = [
  { key: 'info', label: '编辑信息' },
  { key: 'nodes', label: '编辑节点' },
  { key: 'import', label: '导入 JSON' },
];

// ---- Node Create/Edit Modal ----
const NodeModal = ({ mode, initial, teamRegions, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [desc, setDesc] = useState(initial?.description || '');
  const [nodeType, setNodeType] = useState(initial?.nodeType || 'MEMBER');
  const [brainRegionId, setBrainRegionId] = useState(
    initial?.brainRegionId != null ? String(initial.brainRegionId) : ''
  );
  const [tags, setTags] = useState(initial?.tags || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: desc.trim(),
      nodeType,
      brainRegionId: brainRegionId ? parseInt(brainRegionId) : null,
      tags: tags.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white border-opacity-20 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-white text-lg font-bold mb-4">
          {mode === 'create' ? '新建节点' : '编辑节点'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-1">节点名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="节点名称"
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm"
              autoFocus />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">类型</label>
            <select value={nodeType} onChange={e => setNodeType(e.target.value)}
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm">
              <option value="MEMBER">成员</option>
              <option value="PROJECT">项目</option>
            </select>
          </div>
          <div>
            <label className="block text-white text-sm mb-1">所属脑区</label>
            <select value={brainRegionId} onChange={e => setBrainRegionId(e.target.value)}
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm">
              {mode === 'create' ? null : <option value="">未分配</option>}
              {teamRegions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white text-sm mb-1">描述</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              placeholder="节点描述（可选）"
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">标签（可选）</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder='如: leader, bridge:3'
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={onCancel}
              className="px-4 py-2 rounded text-white text-sm bg-gray-500 bg-opacity-50 hover:bg-opacity-70">
              取消
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded text-white text-sm bg-blue-500 bg-opacity-50 hover:bg-opacity-70">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Region Create/Edit Modal ----
const RegionModal = ({ mode, initial, templateRegions, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [colorHex, setColorHex] = useState(initial?.colorHex || '#44aaff');
  const [templateRegionId, setTemplateRegionId] = useState(
    initial?.templateRegionId != null ? String(initial.templateRegionId) : ''
  );

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      colorHex,
      templateRegionId: templateRegionId ? parseInt(templateRegionId) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white border-opacity-20 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-white text-lg font-bold mb-4">
          {mode === 'create' ? '新建脑区' : '编辑脑区'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-1">脑区名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="脑区名称"
              className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm"
              autoFocus />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">颜色</label>
            <div className="flex items-center space-x-2">
              <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              <input type="text" value={colorHex} onChange={e => setColorHex(e.target.value)}
                className="flex-1 bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm font-mono" />
            </div>
          </div>
          {mode === 'create' && (
            <div>
              <label className="block text-white text-sm mb-1">模板脑区</label>
              <select value={templateRegionId} onChange={e => setTemplateRegionId(e.target.value)}
                className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm">
                {templateRegions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={onCancel}
              className="px-4 py-2 rounded text-white text-sm bg-gray-500 bg-opacity-50 hover:bg-opacity-70">
              取消
            </button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded text-white text-sm bg-blue-500 bg-opacity-50 hover:bg-opacity-70">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Delete Region Modal ----
const DeleteRegionModal = ({ region, targetRegions, regionNodes, onConfirm, onCancel }) => {
  const [reassignToRegionId, setReassignToRegionId] = useState('');
  const [setUnassigned, setSetUnassigned] = useState(false);

  const handleConfirm = () => {
    if (setUnassigned) {
      onConfirm({ setUnassigned: true, reassignToRegionId: null });
    } else if (reassignToRegionId) {
      onConfirm({ setUnassigned: false, reassignToRegionId: parseInt(reassignToRegionId) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white border-opacity-20 rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-white text-lg font-bold mb-4">删除脑区: {region?.name}</h3>
        {regionNodes.length > 0 ? (
          <div className="space-y-4">
            <p className="text-white text-sm text-opacity-80">
              该脑区下有 <span className="font-bold text-yellow-300">{regionNodes.length}</span> 个节点，请选择处理方式：
            </p>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-white text-sm cursor-pointer">
                <input type="radio" name="reassign" checked={!setUnassigned} onChange={() => setSetUnassigned(false)}
                  className="w-4 h-4" />
                <span>移动到其他脑区</span>
              </label>
              {!setUnassigned && (
                <select value={reassignToRegionId} onChange={e => setReassignToRegionId(e.target.value)}
                  className="w-full bg-black bg-opacity-30 border border-white border-opacity-20 rounded px-3 py-2 text-white text-sm ml-6">
                  <option value="">选择目标脑区...</option>
                  {targetRegions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
              <label className="flex items-center space-x-2 text-white text-sm cursor-pointer">
                <input type="radio" name="reassign" checked={setUnassigned} onChange={() => setSetUnassigned(true)}
                  className="w-4 h-4" />
                <span>标记为未分配</span>
              </label>
            </div>
          </div>
        ) : (
          <p className="text-white text-sm text-opacity-80">该脑区下没有节点，确认删除？</p>
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={onCancel}
            className="px-4 py-2 rounded text-white text-sm bg-gray-500 bg-opacity-50 hover:bg-opacity-70">
            取消
          </button>
          <button onClick={handleConfirm}
            disabled={!setUnassigned && !reassignToRegionId && regionNodes.length > 0}
            className="px-4 py-2 rounded text-white text-sm bg-red-500 bg-opacity-50 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed">
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Main Page ----
const MyTeamDetail = () => {
  const { id } = useParams();
  const teamId = parseInt(id);
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');

  const { team, nodes, refresh } = useTeamData(teamId);
  const { regions: templateRegions, points: brainPoints } = useBrainData();

  // Team info state
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Node list state
  const [nodeSearch, setNodeSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [teamRegions, setTeamRegions] = useState([]);

  // Node modal state
  const [nodeModal, setNodeModal] = useState(null);

  // Region modal state
  const [regionModal, setRegionModal] = useState(null);
  const [deleteRegionModal, setDeleteRegionModal] = useState(null);

  // MiniBrain toggle
  const [showMiniBrain, setShowMiniBrain] = useState(false);

  // Import state
  const [importStatus, setImportStatus] = useState(null);
  const [importing, setImporting] = useState(false);

  // Sync team data
  useEffect(() => {
    if (team) {
      setTeamName(team.teamName || '');
      setTeamDesc(team.description || '');
    }
  }, [team]);

  // Load team regions
  const loadTeamRegions = () => {
    api.get(`/teams/${teamId}/regions`)
      .then(r => setTeamRegions(r.data))
      .catch(() => {});
  };
  useEffect(() => { loadTeamRegions(); }, [teamId]);

  // ---- Info Tab ----
  const saveInfo = async () => {
    await api.put(`/teams/${teamId}`, { teamName, description: teamDesc });
    refresh();
  };

  // ---- Node Operations ----
  const handleDrop = async (nodeId, regionId) => {
    await api.put(`/admin/nodes/${nodeId}/region`, { brainRegionId: regionId || null });
    refresh();
  };

  const openCreateNode = () => setNodeModal('create');

  const openEditNode = (node) => {
    setNodeModal({
      id: node.id,
      name: node.name,
      description: node.description || '',
      nodeType: node.nodeType,
      brainRegionId: node.brainRegionId,
      tags: node.tags || '',
    });
  };

  const handleSaveNode = async (data) => {
    try {
      if (nodeModal === 'create') {
        await api.post(`/teams/${teamId}/nodes`, data);
      } else {
        await api.put(`/nodes/${nodeModal.id}`, data);
      }
      setNodeModal(null);
      refresh();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteNode = async (node) => {
    if (!window.confirm(`确定删除节点 "${node.name}"？`)) return;
    try {
      await api.delete(`/nodes/${node.id}`);
      refresh();
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  // ---- Region Operations ----
  const openCreateRegion = () => setRegionModal('create');

  const openEditRegion = (region) => {
    setRegionModal({
      id: region.id,
      name: region.name,
      colorHex: region.colorHex,
      templateRegionId: region.templateRegionId,
    });
  };

  const handleSaveRegion = async (data) => {
    try {
      if (regionModal === 'create') {
        await api.post(`/teams/${teamId}/regions`, data);
      } else {
        await api.put(`/teams/${teamId}/regions/${regionModal.id}`, data);
      }
      setRegionModal(null);
      loadTeamRegions();
      refresh();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const openDeleteRegion = (region) => {
    const regionNodes = (nodes || []).filter(n => n.brainRegionId === region.id);
    const targetRegions = teamRegions.filter(r => r.id !== region.id);
    if (teamRegions.length <= 1) {
      alert('至少需要保留一个脑区');
      return;
    }
    setDeleteRegionModal({ region, regionNodes, targetRegions });
  };

  const handleDeleteRegion = async ({ setUnassigned, reassignToRegionId }) => {
    try {
      await api.delete(`/teams/${teamId}/regions/${deleteRegionModal.region.id}`, {
        data: { setUnassigned, reassignToRegionId },
      });
      setDeleteRegionModal(null);
      loadTeamRegions();
      refresh();
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  // ---- Import ----
  const handleImport = async (file) => {
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let created = 0;
      let failed = 0;
      const entries = Object.entries(data);
      if (entries.length === 0) {
        setImportStatus({ type: 'error', message: 'JSON 中没有数据' });
        setImporting(false);
        return;
      }
      for (const [regionIdStr, nodeList] of entries) {
        const brainRegionId = parseInt(regionIdStr);
        for (const entry of nodeList) {
          try {
            await api.post(`/teams/${teamId}/nodes`, {
              name: entry.name || '未命名',
              description: entry.description || '',
              nodeType: entry.nodeType || 'MEMBER',
              brainRegionId,
            });
            created++;
          } catch {
            failed++;
          }
        }
      }
      setImportStatus({
        type: 'success',
        message: `成功导入 ${created} 个节点` + (failed > 0 ? `，${failed} 个失败` : ''),
      });
      refresh();
      loadTeamRegions();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setImportStatus({ type: 'error', message: 'JSON 格式错误' });
      } else {
        setImportStatus({ type: 'error', message: '导入失败: ' + (err.response?.data?.message || err.message) });
      }
    } finally {
      setImporting(false);
    }
  };

  // ---- Filtered nodes ----
  const filteredNodes = (nodes || []).filter(n => {
    return (!nodeSearch || n.name.toLowerCase().includes(nodeSearch.toLowerCase())) &&
           (!regionFilter || String(n.brainRegionId || '') === regionFilter);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="p-3 border-b border-white border-opacity-10 flex items-center space-x-2 text-sm">
        <button onClick={() => navigate('/my-teams')} className="text-blue-400 hover:underline">← 我的团队</button>
        <span className="text-white opacity-40">/</span>
        <span className="text-white">{team?.teamName}</span>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-white border-opacity-20">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm transition-colors ${tab === t.key ? 'border-b-2 border-white text-white' : 'text-white text-opacity-60 hover:text-opacity-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {/* ---- Info Tab ---- */}
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
            <button onClick={saveInfo}
              className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-6 py-2 rounded text-white">保存</button>
          </div>
        )}

        {/* ---- Nodes Tab ---- */}
        {tab === 'nodes' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Node list */}
            <div className="w-1/2 border-r border-white border-opacity-10 p-4 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4">
                <button onClick={openCreateNode}
                  className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-3 py-2 rounded text-white text-sm shrink-0">
                  + 新建节点
                </button>
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
                    className="flex items-center space-x-2 bg-black bg-opacity-20 border border-white border-opacity-10 rounded p-3 min-h-[48px] cursor-grab hover:border-white hover:border-opacity-30 transition-colors group">
                    <span className="text-white text-opacity-40 cursor-grab select-none shrink-0">⋮⋮</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-bold truncate">{node.name}</div>
                      <div className="text-xs text-white text-opacity-50 mt-0.5">
                        {node.nodeType === 'MEMBER' ? '成员' : '项目'} · {node.brainRegionName || '未分配'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); openEditNode(node); }}
                        className="text-blue-400 hover:text-blue-300 text-xs px-1.5 py-0.5 rounded hover:bg-white hover:bg-opacity-10"
                        title="编辑">
                        ✏️
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(node); }}
                        className="text-red-400 hover:text-red-300 text-xs px-1.5 py-0.5 rounded hover:bg-white hover:bg-opacity-10"
                        title="删除">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {filteredNodes.length === 0 && (
                  <div className="text-center text-white text-opacity-40 text-sm py-8">
                    暂无节点
                  </div>
                )}
              </div>
            </div>

            {/* Right: Region list / MiniBrain */}
            <div className="w-1/2 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">
                  {showMiniBrain ? '迷你大脑' : '脑区列表'}
                </h3>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setShowMiniBrain(!showMiniBrain)}
                    className="text-xs text-blue-400 hover:underline">
                    {showMiniBrain ? '切换脑区列表' : '切换迷你大脑'}
                  </button>
                  {!showMiniBrain && (
                    <button onClick={openCreateRegion}
                      className="text-xs bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-2 py-1 rounded text-white">
                      + 新建脑区
                    </button>
                  )}
                </div>
              </div>

              {showMiniBrain ? (
                <div className="flex justify-center mt-4">
                  <MiniBrain brainPoints={brainPoints} regions={teamRegions} width={400} height={400} />
                </div>
              ) : (
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
                        handleDrop(parseInt(e.dataTransfer.getData('nodeId')), region.id);
                        e.currentTarget.style.borderColor = '';
                        e.currentTarget.style.borderWidth = '';
                      }}
                      className="bg-black bg-opacity-20 border border-white border-opacity-10 rounded-lg p-4 transition-all group">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: region.colorHex }} />
                        <span className="text-white text-sm flex-1">{region.name}</span>
                        <span className="text-white text-opacity-40 text-xs">
                          {(nodes || []).filter(n => n.brainRegionId === region.id).length} 节点
                        </span>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditRegion(region)}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                            title="编辑脑区">
                            ✏️
                          </button>
                          <button onClick={() => openDeleteRegion(region)}
                            className="text-red-400 hover:text-red-300 text-xs"
                            title="删除脑区">
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {teamRegions.length === 0 && (
                    <div className="text-center text-white text-opacity-40 text-sm py-8">
                      暂无脑区，点击"+ 新建脑区"创建
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- Import Tab ---- */}
        {tab === 'import' && (
          <div className="max-w-lg mx-auto p-6 space-y-4">
            <div className="border-2 border-dashed border-white border-opacity-30 rounded-lg p-8 text-center">
              <p className="text-white text-opacity-60 mb-4">上传 JSON 文件批量导入节点</p>
              <input type="file" accept=".json"
                disabled={importing}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  await handleImport(file);
                  e.target.value = '';
                }}
                className="text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:bg-opacity-50 file:text-white hover:file:bg-opacity-70" />
              {importing && (
                <p className="text-blue-400 text-sm mt-4 animate-pulse">导入中...</p>
              )}
              {importStatus && (
                <p className={`text-sm mt-4 ${importStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {importStatus.message}
                </p>
              )}
            </div>
            <div className="bg-black bg-opacity-30 p-4 rounded">
              <h3 className="text-white font-bold mb-2">格式说明</h3>
              <pre className="text-xs text-white text-opacity-60 whitespace-pre-wrap">
{`{
  "脑区ID": [
    {"name": "节点名称", "description": "描述", "nodeType": "MEMBER"},
    {"name": "项目名称", "description": "描述", "nodeType": "PROJECT"}
  ],
  "脑区ID2": [...]
}`}
              </pre>
              <p className="text-xs text-white text-opacity-40 mt-2">
                提示: 脑区ID 为团队脑区列表中的 ID，nodeType 可选 "MEMBER" 或 "PROJECT"，默认为 "MEMBER"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {nodeModal && (
        <NodeModal
          mode={nodeModal === 'create' ? 'create' : 'edit'}
          initial={nodeModal === 'create' ? null : nodeModal}
          teamRegions={teamRegions}
          onSave={handleSaveNode}
          onCancel={() => setNodeModal(null)}
        />
      )}

      {regionModal && (
        <RegionModal
          mode={regionModal === 'create' ? 'create' : 'edit'}
          initial={regionModal === 'create' ? null : regionModal}
          templateRegions={templateRegions}
          onSave={handleSaveRegion}
          onCancel={() => setRegionModal(null)}
        />
      )}

      {deleteRegionModal && (
        <DeleteRegionModal
          region={deleteRegionModal.region}
          targetRegions={deleteRegionModal.targetRegions}
          regionNodes={deleteRegionModal.regionNodes}
          onConfirm={handleDeleteRegion}
          onCancel={() => setDeleteRegionModal(null)}
        />
      )}
    </div>
  );
};

export default MyTeamDetail;
