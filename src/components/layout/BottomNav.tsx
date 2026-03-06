import { NavLink } from 'react-router-dom';
import { ScanBarcode, ShoppingBag, BarChart3, Settings, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

export default function BottomNav() {
  const { canViewReports, isAdmin } = useAuth();

  const items: NavItem[] = [
    { to: '/scan', icon: ScanBarcode, label: 'Scan' },
    { to: '/baskets', icon: ShoppingBag, label: 'Baskets' },
    ...(canViewReports ? [{ to: '/reports', icon: BarChart3, label: 'Reports' }] : []),
    ...(isAdmin ? [{ to: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-grey h-16 flex items-center z-40 md:justify-center md:gap-2 md:px-6">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors
             md:flex-none md:flex-row md:h-auto md:px-4 md:py-2 md:rounded-lg md:gap-2 ${
              isActive
                ? 'text-primark-blue md:bg-primark-blue/10'
                : 'text-mid-grey hover:text-navy md:hover:bg-light-grey'
            }`
          }
        >
          <span className="flex-shrink-0 md:[&>svg]:w-[18px] md:[&>svg]:h-[18px]"><item.icon size={22} /></span>
          <span className="text-[11px] font-medium md:text-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
