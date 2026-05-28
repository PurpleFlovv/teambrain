import { useState } from 'react';
import GlassModal from './GlassModal';
import FormField from './FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <GlassModal
      open={true}
      onOpenChange={onCancel}
      title={mode === 'create' ? '新建脑区' : '编辑脑区'}
      className="sm:max-w-md"
    >
      <div className="space-y-4">
        <FormField label="脑区名称">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="脑区名称" autoFocus />
        </FormField>
        <FormField label="颜色">
          <div className="flex items-center space-x-2">
            <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
            <Input value={colorHex} onChange={e => setColorHex(e.target.value)} className="flex-1 font-mono" />
          </div>
        </FormField>
        {mode === 'create' && (
          <FormField label="模板脑区">
            <select value={templateRegionId} onChange={e => setTemplateRegionId(e.target.value)}
              className="w-full bg-black bg-opacity-30 border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm">
              <option value="">选择模板脑区...</option>
              {templateRegions.map(r => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>
          </FormField>
        )}
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </GlassModal>
  );
};

export default RegionModal;
