import { cn } from '@/lib/utils';

const PageShell = ({ loading, error, maxWidth = 'max-w-4xl', className, children }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--text-muted)] text-lg animate-pulse">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <p className="text-[var(--text-muted)]">加载失败</p>
          <p className="text-[var(--destructive)] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-6 mx-auto', maxWidth, className)}>
      {children}
    </div>
  );
};

export default PageShell;
