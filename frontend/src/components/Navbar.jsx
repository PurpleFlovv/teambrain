import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = cn(
    'px-3 py-2 text-sm transition-colors rounded',
    'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
  );

  return (
    <div className="h-14 bg-[var(--glass-bg)] backdrop-blur-[16px] border-b border-[var(--glass-border)] flex items-center justify-between px-6 shrink-0 relative z-30">
      <button onClick={() => navigate('/')} className="text-[var(--text-primary)] font-bold text-lg hover:opacity-80 transition-opacity">
        TeamBrain
      </button>

      {/* Hamburger button - visible only on mobile */}
      <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Navigation links */}
      <div className={`${menuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:relative top-14 md:top-0 left-0 right-0 bg-[var(--bg-deep-space)] md:bg-transparent p-4 md:p-0 space-y-2 md:space-y-0 md:space-x-1 items-start md:items-center z-50`}>
        <button onClick={() => { navigate('/my-teams'); setMenuOpen(false); }} className={linkClass}>我的团队</button>
        <button onClick={() => { navigate('/teams'); setMenuOpen(false); }} className={linkClass}>团队广场</button>
        <button onClick={() => { navigate('/profile'); setMenuOpen(false); }} className={linkClass}>个人信息</button>
        <button onClick={() => { navigate('/about'); setMenuOpen(false); }} className={linkClass}>关于</button>
        {(user?.roles?.includes('ADMIN') || user?.roles?.includes('TEAM_ADMIN')) && (
          <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className={cn(linkClass, 'border border-[var(--glass-border)] md:ml-2')}>
            管理
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
