import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, ScrollText, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBrainData } from '../hooks/useBrainData';
import { useTeamData } from '../hooks/useTeamData';
import MiniBrain from '../components/MiniBrain';
import BrainPointCloud from '../components/BrainPointCloud';
import GlassModal from '../components/shared/GlassModal';
import { Button } from '@/components/ui/button';
import TeamEditPage from './TeamEditPage';
import api from '../services/api';

const ADMIN_TABS = [
  { key: '', label: '仪表盘', icon: LayoutDashboard },
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'teams', label: '团队管理', icon: Building2 },
  { key: 'logs', label: '操作日志', icon: ScrollText },
];

// ---- Dashboard ----
const Dashboard = () => {
  const navigate = useNavigate();
  const { regions, points: brainPoints } = useBrainData();
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const { team, nodes, connections } = useTeamData(selectedTeamId);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/teams').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) setSelectedTeamId(teams[0].id);
  }, [teams, selectedTeamId]);

  const regionDist = {};
  if (nodes) {
    nodes.forEach(n => {
      const name = n.brainRegionName || '未知';
      regionDist[name] = (regionDist[name] || 0) + 1;
    });
  }
  const regionEntries = regions
    .map(r => ({ name: r.name, color: r.colorHex, count: regionDist[r.name] || 0 }))
    .sort((a, b) => a.color && b.color ? 0 : 0);
  const maxDist = Math.max(1, ...Object.values(regionDist));

  return (
    <div className="p-4 space-y-3 max-h-[calc(100vh-56px)] overflow-y-auto">
      <div className="flex items-center space-x-3">
        <label className="text-white text-sm opacity-60">选择团队：</label>
        <select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(parseInt(e.target.value))}
          className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-1.5 text-[var(--text-primary)] text-sm">
          {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '成员', value: nodes.filter(n => n.nodeType === 'MEMBER').length, color: '#44aaff' },
          { label: '项目', value: nodes.filter(n => n.nodeType === 'PROJECT').length, color: '#aa44ff' },
          { label: '脑区', value: new Set(nodes.map(n => n.brainRegionId)).size, color: '#44ffaa' },
          { label: '连接', value: connections.length, color: '#ffaa44' },
        ].map(c => (
          <div key={c.label} className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded-lg p-3 min-w-[120px] text-center">
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs opacity-60 text-white mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4" style={{ maxHeight: 'min(50vh, 420px)' }}>
        <div className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded-lg p-4 flex flex-col">
          <h3 className="text-white text-sm font-bold mb-3">3D 脑区预览</h3>
          <div className="flex-1 flex items-center justify-center">
            <MiniBrain brainPoints={brainPoints} regions={regions} width={360} height={Math.min(window.innerHeight * 0.4, 360)} />
          </div>
        </div>
        <div className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded-lg p-4 flex flex-col">
          <h3 className="text-white text-sm font-bold mb-3">脑区节点分布</h3>
          <div className="space-y-3 mt-2 flex-1 overflow-y-auto">
            {regionEntries.map(({ name, color, count }) => {
              const pct = Math.round(count / maxDist * 100);
              return (
                <div key={name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color || '#888' }} />
                  <span className="text-white text-xs w-16 shrink-0">{name}</span>
                  <div className="flex-1 h-4 bg-white bg-opacity-5 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: color || '#888', opacity: 0.6 }} />
                  </div>
                  <span className="text-white text-xs w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded-lg p-4 flex justify-around">
          <button onClick={() => navigate('/admin/users')} className="text-sm text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center space-x-1">
            <Users className="w-4 h-4" /> <span>{stats.userCount} 用户</span>
          </button>
          <button onClick={() => navigate('/admin/teams')} className="text-sm text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center space-x-1">
            <Building2 className="w-4 h-4" /> <span>{stats.teamCount} 团队</span>
          </button>
          <button onClick={() => navigate('/admin/logs')} className="text-sm text-[var(--text-primary)] hover:text-[var(--accent)] flex items-center space-x-1">
            <FileText className="w-4 h-4" /> <span>{stats.nodeCount} 节点</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ---- User Management ----
const UserForm = ({ initial, onSave, onCancel }) => {
  const [username, setUsername] = useState(initial?.username || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState(initial?.roles || ['USER']);
  const toggleRole = (r) => setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = '请输入用户名';
    if (!initial && !password) errs.password = '请输入密码';
    if (!email.trim()) errs.email = '请输入邮箱';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white text-sm mb-1">用户名</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm" />
        {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
      </div>
      <div>
        <label className="block text-white text-sm mb-1">邮箱</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm" />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-white text-sm mb-1">{initial ? '新密码（留空不修改）' : '密码'}</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm" />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
      </div>
      <div>
        <label className="block text-white text-sm mb-1">角色</label>
        <div className="flex space-x-4">
          {['USER', 'ADMIN'].map(r => (
            <label key={r} className="flex items-center space-x-2 text-white text-sm cursor-pointer">
              <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} className="w-4 h-4" />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded text-white text-sm bg-gray-500 bg-opacity-50">取消</button>
        <button onClick={() => { if (validate()) onSave({ username, email, password, roles }); }} className="px-4 py-2 rounded text-white text-sm bg-blue-500 bg-opacity-50">保存</button>
      </div>
    </div>
  );
};

const UserList = () => {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const load = () => api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchTeam = !teamFilter || (u.teamId && u.teamId.toString() === teamFilter);
    return matchSearch && matchTeam;
  });

  const handleSave = async (form) => {
    if (modal === 'create') {
      await api.post('/admin/users', form);
    } else {
      await api.put(`/admin/users/${modal.id}`, form);
    }
    setModal(null);
    load();
  };

  const handleDelete = (u) => {
    setConfirmAction({
      message: `确定删除用户 ${u.username}？此操作不可撤销。`,
      onConfirm: async () => {
        await api.delete(`/admin/users/${u.id}`);
        load();
      },
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">用户管理</h2>
        <button onClick={() => setModal('create')} className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-4 py-2 rounded text-white text-sm">+ 新建用户</button>
      </div>
      <div className="flex items-center mb-4">
        <input type="text" placeholder="搜索用户名或邮箱..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm" />
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
          className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-1.5 text-[var(--text-primary)] text-sm ml-2">
          <option value="">全部团队</option>
          {[...new Map(users.filter(u => u.teamId).map(u => [u.teamId, u.teamName])).entries()].map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>
      <div className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded-lg overflow-hidden">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-white border-opacity-10 text-left">
              <th className="p-3 opacity-60">状态</th><th className="p-3 opacity-60">用户名</th><th className="p-3 opacity-60">邮箱</th>
              <th className="p-3 opacity-60">角色</th><th className="p-3 opacity-60">团队</th><th className="p-3 opacity-60">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                <td className="p-3">
                  <button onClick={async () => { await api.put(`/admin/users/${u.id}/state`, { enabled: !u.enabled }); load(); }}
                    className={`w-3 h-3 rounded-full ${u.enabled ? 'bg-green-400' : 'bg-red-400'}`} title={u.enabled ? '启用' : '禁用'} />
                </td>
                <td className="p-3">{u.username}</td><td className="p-3 opacity-60">{u.email}</td>
                <td className="p-3">{(u.roles || []).join(', ')}</td>
                <td className="p-3">
                  {u.teamName ? (
                    <span>{u.teamName}</span>
                  ) : (
                    <button onClick={() => navigate('/join-team')} className="text-blue-400 hover:underline text-xs">未加入 - 选择团队</button>
                  )}
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => setModal(u)} className="text-blue-400 hover:underline text-xs">编辑</button>
                  {u.username !== me?.username && (
                    <button onClick={() => handleDelete(u)} className="text-red-400 hover:underline text-xs">删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <GlassModal open={true} onOpenChange={() => setModal(null)} title={modal === 'create' ? '新建用户' : '编辑用户'}>
          <UserForm initial={modal === 'create' ? null : modal} onSave={handleSave} onCancel={() => setModal(null)} />
        </GlassModal>
      )}

      {confirmAction && (
        <GlassModal open={true} onOpenChange={() => setConfirmAction(null)} title="确认操作">
          <p className="text-[var(--text-primary)] mb-6">{confirmAction.message}</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>取消</Button>
            <Button variant="destructive" onClick={async () => { await confirmAction.onConfirm(); setConfirmAction(null); }}>确认</Button>
          </div>
        </GlassModal>
      )}
    </div>
  );
};

// ---- Team Management ----
const TeamList = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => { api.get('/admin/teams').then(r => setTeams(r.data)).catch(() => {}); }, []);

  const filtered = teams.filter(t =>
    t.teamName.toLowerCase().includes(search.toLowerCase()) ||
    t.ownerUsername.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (t) => {
    setConfirmAction({
      message: `确定删除团队 ${t.teamName}？节点和连接将一并删除。`,
      onConfirm: async () => {
        await api.delete(`/admin/teams/${t.id}`);
        setTeams(prev => prev.filter(x => x.id !== t.id));
      },
    });
  };

  const handleEditClick = (t) => {
    navigate(`/admin/teams/${t.id}/edit`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">团队管理</h2>
        <button onClick={() => { setNewTeamName(''); setNewTeamDesc(''); setCreateModal(true); }} className="bg-blue-500 bg-opacity-50 hover:bg-opacity-70 px-4 py-2 rounded text-white text-sm">+ 新建团队</button>
      </div>
      <input type="text" placeholder="搜索团队名或所有者..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm mb-4" />
      <div className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded-lg overflow-hidden">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-white border-opacity-10 text-left">
              <th className="p-3 opacity-60">团队名</th><th className="p-3 opacity-60">所有者</th>
              <th className="p-3 opacity-60">成员</th><th className="p-3 opacity-60">项目</th><th className="p-3 opacity-60">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                <td className="p-3">{t.teamName}</td><td className="p-3">{t.ownerUsername}</td>
                <td className="p-3">{t.memberCount}</td><td className="p-3">{t.projectCount}</td>
                <td className="p-3 space-x-2">
                  <button onClick={() => navigate(`/admin/teams/${t.id}`)} className="text-blue-400 hover:underline text-xs">查看</button>
                  <button onClick={() => handleEditClick(t)} className="text-blue-400 hover:underline text-xs">编辑</button>
                  <button onClick={() => handleDelete(t)} className="text-red-400 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {createModal && (
        <GlassModal open={true} onOpenChange={() => setCreateModal(false)} title="新建团队">
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm mb-1">团队名称</label>
              <input type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="团队名称"
                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">团队描述</label>
              <input type="text" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} placeholder="团队描述"
                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setCreateModal(false)}>取消</Button>
              <Button onClick={async () => {
                await api.post('/admin/teams', { teamName: newTeamName, description: newTeamDesc });
                setCreateModal(false);
                api.get('/admin/teams').then(r => setTeams(r.data));
              }}>保存</Button>
            </div>
          </div>
        </GlassModal>
      )}

      {confirmAction && (
        <GlassModal open={true} onOpenChange={() => setConfirmAction(null)} title="确认操作">
          <p className="text-[var(--text-primary)] mb-6">{confirmAction.message}</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>取消</Button>
            <Button variant="destructive" onClick={async () => { await confirmAction.onConfirm(); setConfirmAction(null); }}>确认</Button>
          </div>
        </GlassModal>
      )}
    </div>
  );
};

// ---- Team Detail ----
const TeamDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.pathname.match(/\/admin\/teams\/(\d+)/);
  const teamId = match ? parseInt(match[1]) : null;
  const { regions, points: brainPoints, loading: brainLoading } = useBrainData(teamId);
  const { team, nodes, loading: teamLoading } = useTeamData(teamId);
  const [strategyConns, setStrategyConns] = useState([]);

  useEffect(() => {
    if (!teamId) return;
    api.get(`/admin/teams/${teamId}/connections/computed`).then(r => setStrategyConns(r.data)).catch(() => {});
  }, [teamId]);

  if (brainLoading || teamLoading) {
    return <div className="flex items-center justify-center h-full text-white text-opacity-60">加载团队数据中...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 p-4 border-b border-white border-opacity-10">
        <button onClick={() => navigate('/admin/teams')} className="text-blue-400 text-sm hover:underline flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>团队列表</span>
        </button>
        <span className="text-white opacity-40">/</span>
        <span className="text-white text-sm">{team?.teamName}</span>
      </div>
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <BrainPointCloud brainPoints={brainPoints} regions={regions} team={team} nodes={nodes} connRules={strategyConns} onRefresh={() => {}} />
        </div>
        <div className="w-72 border-l border-white border-opacity-10 p-4 overflow-y-auto">
          <h3 className="text-white font-bold mb-3">节点列表 ({nodes.length})</h3>
          <div className="space-y-2">
            {nodes.map(n => (
              <div key={n.id} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded p-2">
                <div className="text-white text-sm font-bold">{n.name}</div>
                <div className="text-xs opacity-60 text-white mt-1">
                  <span className={`px-1.5 py-0.5 rounded ${n.nodeType === 'MEMBER' ? 'bg-blue-500 bg-opacity-30' : 'bg-purple-500 bg-opacity-30'}`}>{n.nodeType === 'MEMBER' ? '成员' : '项目'}</span>
                  <span className="ml-2">{n.brainRegionName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Audit Log ----
const LogList = () => {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = (p = 0) => {
    api.get('/admin/logs', { params: { action: action || undefined, page: p, size: 20 } })
      .then(r => { setLogs(r.data.content); setTotalPages(r.data.totalPages); }).catch(() => {});
  };
  useEffect(() => { load(page); }, [page, action]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">操作日志</h2>
      <div className="flex items-center space-x-2 mb-4">
        <label className="text-white text-sm opacity-60">操作类型：</label>
        <select value={action} onChange={e => { setAction(e.target.value); setPage(0); }}
          className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded px-3 py-1.5 text-[var(--text-primary)] text-sm">
          <option value="">全部</option>
          <option value="CREATE_USER">CREATE_USER</option>
          <option value="UPDATE_USER">UPDATE_USER</option>
          <option value="DELETE_USER">DELETE_USER</option>
          <option value="DELETE_TEAM">DELETE_TEAM</option>
          <option value="UPDATE_TEAM">UPDATE_TEAM</option>
          <option value="UPDATE_REGION">UPDATE_REGION</option>
        </select>
      </div>
      <div className="bg-[var(--glass-bg)] backdrop-blur-[16px] border border-[var(--glass-border)] rounded-lg overflow-hidden">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-white border-opacity-10 text-left">
              <th className="p-3 opacity-60">时间</th><th className="p-3 opacity-60">操作者</th>
              <th className="p-3 opacity-60">操作</th><th className="p-3 opacity-60">详情</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5">
                <td className="p-3 text-xs opacity-60">{l.createdAt}</td>
                <td className="p-3">{l.username}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-white bg-opacity-10">{l.action}</span></td>
                <td className="p-3 opacity-80">{l.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => { setPage(i); load(i); }}
              className={`px-3 py-1 rounded text-sm ${page === i ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-10 text-white'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---- Main AdminPage with Sidebar ----
const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const subPath = location.pathname.replace('/admin/', '').replace('/admin', '');

  const menuKey = subPath.startsWith('teams/') ? 'teams' : (subPath || '');

  const content = (() => {
    if (subPath.startsWith('teams/')) {
      if (subPath.endsWith('/edit')) return <TeamEditPage />;
      return <TeamDetail />;
    }
    switch (subPath) {
      case 'users': return <UserList />;
      case 'teams': return <TeamList />;
      case 'logs': return <LogList />;
      default: return <Dashboard />;
    }
  })();

  return (
    <div className="flex flex-col h-full bg-[var(--bg-deep-space)]">
      {/* Admin tab bar */}
      <div className="border-b border-[var(--glass-border)] bg-[var(--bg-deep-space)]">
        <div className="max-w-7xl mx-auto px-6 flex">
          {ADMIN_TABS.map(m => {
            const active = (m.key === 'teams' && subPath.startsWith('teams/')) || menuKey === m.key;
            return (
              <button
                key={m.key}
                onClick={() => navigate(m.key ? `/admin/${m.key}` : '/admin')}
                className={`px-5 py-3 text-sm flex items-center space-x-2 transition-colors border-b-2 ${
                  active
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <m.icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">{content}</div>
    </div>
  );
};

export default AdminPage;
