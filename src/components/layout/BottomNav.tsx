import { NavLink } from 'react-router-dom';
import { ScanBarcode, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export default function BottomNav() {
  const { canViewReports, isAdmin } = useAuth();

  const items: NavItem[] = [
    {
      to: '/scan',
      label: 'Scan',
      icon: <ScanBarcode size={22} />,
    },
    ...(canViewReports
      ? [{ to: '/reports', label: 'Reports', icon: <BarChart3 size={22} /> }]
      : []),
    ...(isAdmin
      ? [{ to: '/admin', label: 'Admin', icon: <Settings size={22} /> }]
      : []),
  ];

  return (
    <nav
      className="flex bg-white border-t border-border-grey shrink-0"
      style={{ height: '64px' }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [
              'flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
              isActive ? 'text-primark-blue' : 'text-mid-grey',
            ].join(' ')
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
