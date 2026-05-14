import { cn } from '@/lib/utils';

const GlassCard = ({ variant = 'default', className, children, ...props }) => (
  <div
    className={cn(
      'rounded-lg border backdrop-blur-[16px]',
      variant === 'accent'
        ? 'bg-[var(--glass-bg)] border-[var(--accent)]/20 shadow-[var(--accent-glow)]'
        : 'bg-[var(--glass-bg)] border-[var(--glass-border)]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default GlassCard;
