import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NavBar() {
  const { user, store, logout } = useAuth();

  return (
    <header
      className="flex items-center justify-between px-4 bg-navy text-white shrink-0"
      style={{ height: '56px' }}
    >
      {/* Brand */}
      <div>
        <span
          className="text-primark-blue font-bold uppercase"
          style={{ letterSpacing: '0.15em', fontSize: '18px' }}
        >
          PRIMARK
        </span>
        <span className="text-mid-grey text-sm ml-2">Qbust.it</span>
      </div>

      {/* User info + logout */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs text-mid-grey mt-0.5">{store?.name}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut size={20} className="text-mid-grey" />
          </button>
        </div>
      )}
    </header>
  );
}
