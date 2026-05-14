import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const linkClass = cn(
    'px-3 py-2 text-sm transition-colors rounded',
    'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
  );

  return (
    <div className="h-14 bg-[var(--glass-bg)] backdrop-blur-[16px] border-b border-[var(--glass-border)] flex items-center justify-between px-6 shrink-0">
      <button onClick={() => navigate('/')} className="text-[var(--text-primary)] font-bold text-lg hover:opacity-80 transition-opacity">
        TeamBrain
      </button>
      <div className="flex items-center space-x-1">
        <button onClick={() => navigate('/my-teams')} className={linkClass}>我的团队</button>
        <button onClick={() => navigate('/teams')} className={linkClass}>团队广场</button>
        <button onClick={() => navigate('/profile')} className={linkClass}>个人信息</button>
        {user?.roles?.includes('ADMIN') && (
          <button onClick={() => navigate('/admin')} className={cn(linkClass, 'border border-[var(--glass-border)] ml-2')}>
            管理
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
