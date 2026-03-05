import { ReactNode } from 'react';
import EmptyState from './EmptyState';
import { BarChart3 } from 'lucide-react';

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T, idx: number) => string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-light-grey rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found.',
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-grey bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-grey bg-light-grey">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-mid-grey uppercase tracking-wide whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            : data.length === 0
            ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={<BarChart3 size={40} />}
                    message={emptyMessage}
                  />
                </td>
              </tr>
            )
            : data.map((row, idx) => (
              <tr
                key={keyExtractor ? keyExtractor(row, idx) : idx}
                className="border-b border-border-grey last:border-0 hover:bg-light-grey/50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-charcoal">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
