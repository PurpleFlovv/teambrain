import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const GlassModal = ({ open, onOpenChange, title, description, children, className }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        'bg-[var(--glass-bg)] backdrop-blur-[16px] border-[var(--glass-border)] text-[var(--text-primary)] max-h-[85vh] overflow-y-auto',
        className
      )}
    >
      {(title || description) && (
        <DialogHeader>
          {title && <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
      )}
      {children}
    </DialogContent>
  </Dialog>
);

export default GlassModal;
