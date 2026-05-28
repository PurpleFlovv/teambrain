import { useState } from 'react';
import GlassModal from './GlassModal';
import FormField from './FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
    <GlassModal
      open={true}
      onOpenChange={onCancel}
      title={mode === 'create' ? '新建节点' : '编辑节点'}
      className="sm:max-w-md"
    >
      <div className="space-y-4">
        <FormField label="节点名称">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="节点名称" autoFocus />
        </FormField>
        <FormField label="类型">
          <select value={nodeType} onChange={e => setNodeType(e.target.value)}
            className="w-full bg-black bg-opacity-30 border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm">
            <option value="MEMBER">成员</option>
            <option value="PROJECT">项目</option>
          </select>
        </FormField>
        <FormField label="所属脑区">
          <select value={brainRegionId} onChange={e => setBrainRegionId(e.target.value)}
            className="w-full bg-black bg-opacity-30 border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm">
            {mode !== 'create' && <option value="">未分配</option>}
            {teamRegions.map(r => (
              <option key={r.id} value={String(r.id)}>{r.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="描述">
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="节点描述（可选）" />
        </FormField>
        <FormField label="标签（可选）">
          <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="如: leader, bridge:3" />
        </FormField>
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </GlassModal>
  );
};

export default NodeModal;
