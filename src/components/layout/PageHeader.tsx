import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border-grey">
      <div>
        <h1 className="text-lg font-bold text-navy leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-mid-grey mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
