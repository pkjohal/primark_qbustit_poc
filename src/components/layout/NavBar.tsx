import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Menu, X, ScanBarcode, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NavBar() {
  const { user, store, logout, canViewReports, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

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

      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-border-grey overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-border-grey">
                <p className="text-sm font-semibold text-navy leading-none">{user.name}</p>
                <p className="text-xs text-mid-grey mt-1">{store?.name}</p>
              </div>

              {/* Nav links */}
              <nav className="py-1">
                <NavLink
                  to="/scan"
                  onClick={close}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive ? 'text-primark-blue font-medium bg-blue-50' : 'text-charcoal hover:bg-light-grey'
                    }`
                  }
                >
                  <ScanBarcode size={16} />
                  Scan
                </NavLink>

                {canViewReports && (
                  <NavLink
                    to="/reports"
                    onClick={close}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive ? 'text-primark-blue font-medium bg-blue-50' : 'text-charcoal hover:bg-light-grey'
                      }`
                    }
                  >
                    <BarChart3 size={16} />
                    Reports
                  </NavLink>
                )}

                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={close}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive ? 'text-primark-blue font-medium bg-blue-50' : 'text-charcoal hover:bg-light-grey'
                      }`
                    }
                  >
                    <Settings size={16} />
                    Admin
                  </NavLink>
                )}
              </nav>

              {/* Logout */}
              <div className="border-t border-border-grey">
                <button
                  onClick={() => { close(); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
