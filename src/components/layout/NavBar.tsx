import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ScanBarcode, ShoppingBag, BarChart3, Settings, LogOut, X, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/types';

export default function NavBar() {
  const { user, store, logout, canViewReports, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const navItems = [
    { to: '/scan', icon: ScanBarcode, label: 'Scan' },
    { to: '/baskets', icon: ShoppingBag, label: 'Baskets' },
    ...(canViewReports ? [{ to: '/reports', icon: BarChart3, label: 'Reports' }] : []),
    ...(isAdmin ? [{ to: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  return (
    <>
      <header className="bg-navy h-14 flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-40">
        {/* Branding */}
        <div>
          <span className="font-primark text-primark-blue uppercase" style={{ fontSize: '20px', letterSpacing: '0.2em' }}>PRIMARK</span>
          <span className="text-mid-grey text-sm ml-2">Qbust.it</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* User info — desktop only */}
          {user && (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-white text-sm font-medium leading-none">{user.name}</p>
                <p className="text-mid-grey text-xs mt-0.5">{store?.name}</p>
              </div>
              <span className="bg-primark-blue/20 text-primark-blue text-xs font-semibold rounded-full px-2.5 py-1">
                {ROLE_LABELS[user.role]}
              </span>
              <button
                onClick={logout}
                className="p-1.5 text-mid-grey hover:text-white transition-colors"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden text-white p-1.5 hover:text-primark-blue transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40" />
      )}

      {/* Slide-in drawer */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-72 bg-navy z-50 flex flex-col shadow-2xl transition-transform duration-250 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-white text-sm font-semibold leading-tight">{user?.name}</p>
            <p className="text-mid-grey text-xs leading-tight">{store?.name}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-mid-grey hover:text-white transition-colors p-1.5"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primark-blue/20 text-primark-blue'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-8 border-t border-white/10 pt-3 flex-shrink-0">
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
