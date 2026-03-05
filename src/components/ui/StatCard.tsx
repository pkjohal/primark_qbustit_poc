interface StatCardProps {
  value: string | number;
  label: string;
  isLoading?: boolean;
}

export default function StatCard({ value, label, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div
        className="bg-white rounded-xl p-4 shrink-0"
        style={{
          minWidth: '140px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div className="h-10 w-20 bg-light-grey rounded-lg animate-pulse mb-2" />
        <div className="h-3 w-24 bg-light-grey rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl p-4 shrink-0"
      style={{
        minWidth: '140px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="text-primark-blue font-bold leading-none mb-1"
        style={{ fontSize: '36px' }}
      >
        {value}
      </div>
      <p
        className="text-mid-grey font-medium uppercase"
        style={{ fontSize: '12px', letterSpacing: '0.05em' }}
      >
        {label}
      </p>
    </div>
  );
}
