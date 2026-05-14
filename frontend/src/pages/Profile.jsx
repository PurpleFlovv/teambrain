import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import FormField from '../components/shared/FormField';
import PageShell from '../components/shared/PageShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}`, { email, password: password || undefined });
      toast.success('已保存');
    } catch (err) {
      toast.error('保存失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell maxWidth="max-w-lg">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">个人信息</h2>
      <GlassCard className="p-6 space-y-4">
        <FormField label="用户名">
          <Input value={user?.username || ''} disabled className="opacity-50 cursor-not-allowed" />
        </FormField>
        <FormField label="邮箱">
          <Input value={email} onChange={e => setEmail(e.target.value)} />
        </FormField>
        <FormField label="新密码（留空不修改）">
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </FormField>
        <div className="flex justify-between pt-2">
          <Button variant="destructive" onClick={logout}>退出登录</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">角色：{(user?.roles || []).join(', ')}</p>
      </GlassCard>
    </PageShell>
  );
};

export default Profile;
