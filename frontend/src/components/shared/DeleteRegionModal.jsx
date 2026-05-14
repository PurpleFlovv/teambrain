import { useState } from 'react';
import GlassModal from './GlassModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
    <GlassModal
      open={true}
      onOpenChange={onCancel}
      title={`删除脑区: ${region?.name}`}
      className="sm:max-w-md"
    >
      {regionNodes.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            该脑区下有 <span className="font-bold text-[var(--warning)]">{regionNodes.length}</span> 个节点，请选择处理方式：
          </p>
          <RadioGroup value={setUnassigned ? 'unassigned' : 'reassign'} onValueChange={v => setSetUnassigned(v === 'unassigned')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reassign" id="reassign" />
              <Label htmlFor="reassign">移动到其他脑区</Label>
            </div>
            {!setUnassigned && (
              <Select value={reassignToRegionId} onValueChange={setReassignToRegionId}>
                <SelectTrigger className="ml-6">
                  <SelectValue placeholder="选择目标脑区..." />
                </SelectTrigger>
                <SelectContent>
                  {targetRegions.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unassigned" id="unassigned" />
              <Label htmlFor="unassigned">标记为未分配</Label>
            </div>
          </RadioGroup>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">该脑区下没有节点，确认删除？</p>
      )}
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>取消</Button>
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={!setUnassigned && !reassignToRegionId && regionNodes.length > 0}
        >
          确认删除
        </Button>
      </div>
    </GlassModal>
  );
};

export default DeleteRegionModal;
