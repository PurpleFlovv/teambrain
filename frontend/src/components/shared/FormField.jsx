import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FormField = ({ label, error, htmlFor, className, children }) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <Label htmlFor={htmlFor} className="text-[var(--text-primary)] text-sm">
        {label}
      </Label>
    )}
    {children}
    {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
  </div>
);

export default FormField;
