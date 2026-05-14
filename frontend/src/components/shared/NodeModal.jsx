import { useState } from 'react';
import GlassModal from './GlassModal';
import FormField from './FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          <Select value={nodeType} onValueChange={setNodeType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">成员</SelectItem>
              <SelectItem value="PROJECT">项目</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="所属脑区">
          <Select value={brainRegionId} onValueChange={setBrainRegionId}>
            <SelectTrigger>
              <SelectValue placeholder={mode === 'create' ? '选择脑区...' : '未分配'} />
            </SelectTrigger>
            <SelectContent>
              {mode !== 'create' && <SelectItem value="">未分配</SelectItem>}
              {teamRegions.map(r => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
