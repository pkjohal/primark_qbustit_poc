interface ItemCountBadgeProps {
  count: number;
}

export default function ItemCountBadge({ count }: ItemCountBadgeProps) {
  return (
    <div
      className="flex items-center justify-center bg-primark-blue text-white font-bold rounded-full px-3"
      style={{ minWidth: '48px', height: '32px', fontSize: '15px' }}
    >
      {count} {count === 1 ? 'item' : 'items'}
    </div>
  );
}
