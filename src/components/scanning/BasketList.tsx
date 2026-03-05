import { ScanBarcode, X } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import type { BasketItem } from '@/lib/types';

interface BasketListProps {
  items: BasketItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onGenerate: () => void;
}

export default function BasketList({ items, onRemove, onClear, onGenerate }: BasketListProps) {
  return (
    <div className="flex flex-col bg-white rounded-t-3xl flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-grey shrink-0">
        <span className="text-base font-semibold text-navy">Scanned Items</span>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-danger font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {items.length === 0 ? (
          <EmptyState
            icon={<ScanBarcode size={40} />}
            message="Scan items to get started"
          />
        ) : (
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center px-4 py-2.5 border-b border-border-grey/50 last:border-0"
              >
                <span className="text-xs text-mid-grey w-6 shrink-0">{item.sequence}</span>
                <span className="flex-1 font-mono text-sm text-charcoal tracking-wider">
                  {item.ean}
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 -mr-1 text-mid-grey hover:text-danger transition-colors"
                  aria-label={`Remove ${item.ean}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Generate button */}
      <div className="p-4 border-t border-border-grey shrink-0">
        <button
          onClick={onGenerate}
          disabled={items.length === 0}
          className="w-full py-3.5 rounded-xl bg-primark-blue text-white font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
          style={{ minHeight: '48px' }}
        >
          {items.length === 0
            ? 'Generate QR Code'
            : `Generate QR Code (${items.length} ${items.length === 1 ? 'item' : 'items'})`}
        </button>
      </div>
    </div>
  );
}
