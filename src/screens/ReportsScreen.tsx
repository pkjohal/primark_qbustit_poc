import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useReportData } from '@/hooks/useReportData';
import { useUsers } from '@/hooks/useUsers';
import { useStores } from '@/hooks/useStores';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import DateRangePicker from '@/components/ui/DateRangePicker';
import PageHeader from '@/components/layout/PageHeader';
import { formatRelativeTime } from '@/lib/utils';
import type { ScanSession } from '@/lib/types';
import type { TableColumn } from '@/components/ui/DataTable';

export default function ReportsScreen() {
  const { user, store, canViewAllStores } = useAuth();

  const defaultStoreId = canViewAllStores ? undefined : store?.id;
  const { stats, chartData, sessions, isLoading, filters, setFilters } =
    useReportData(defaultStoreId);

  const { stores } = useStores(false);
  const { users } = useUsers();

  // Load store users for colleague filter
  const [selectedStoreFilter, setSelectedStoreFilter] = useState(defaultStoreId ?? '');

  const handleStoreFilterChange = (storeId: string) => {
    setSelectedStoreFilter(storeId);
    setFilters({ ...filters, storeId: storeId || undefined, userId: undefined });
    if (storeId) users; // trigger fetch
  };

  const columns: TableColumn<ScanSession>[] = [
    { key: 'session_number', header: 'Session #' },
    {
      key: 'user',
      header: 'Colleague',
      render: (row) => (row.user as unknown as { name: string } | undefined)?.name ?? '—',
    },
    { key: 'item_count', header: 'Items' },
    {
      key: 'started_at',
      header: 'Time',
      render: (row) => formatRelativeTime(row.started_at),
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-light-grey overflow-y-auto">
      <PageHeader title="Reports" subtitle="Session analytics" />

      <div className="p-4 space-y-4">
        {/* Filter bar */}
        <div className="bg-white rounded-xl p-4 space-y-3"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <DateRangePicker
            from={filters.from}
            to={filters.to}
            onChange={(from, to) => setFilters({ ...filters, from, to })}
          />
          {canViewAllStores && (
            <select
              value={selectedStoreFilter}
              onChange={(e) => handleStoreFilterChange(e.target.value)}
              className="w-full border border-border-grey rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stat cards — horizontal scroll on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
          <StatCard
            value={isLoading ? '—' : stats.totalItems.toLocaleString()}
            label="Total Items Scanned"
            isLoading={isLoading}
          />
          <StatCard
            value={isLoading ? '—' : stats.totalSessions.toLocaleString()}
            label="QR Codes Generated"
            isLoading={isLoading}
          />
          <StatCard
            value={isLoading ? '—' : stats.avgItemsPerSession.toFixed(1)}
            label="Avg Items per QR"
            isLoading={isLoading}
          />
        </div>

        {/* Bar chart: QR codes per day */}
        <div className="bg-white rounded-xl p-4"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-sm font-semibold text-navy mb-4">QR Codes per Day</h3>
          {isLoading ? (
            <div className="h-40 bg-light-grey rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelStyle={{ color: '#1A1F36', fontWeight: 600 }}
                />
                <Bar dataKey="sessions" fill="#0DAADB" radius={[4, 4, 0, 0]} name="QR Codes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart: items per day */}
        <div className="bg-white rounded-xl p-4"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 className="text-sm font-semibold text-navy mb-4">Items Scanned per Day</h3>
          {isLoading ? (
            <div className="h-40 bg-light-grey rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelStyle={{ color: '#1A1F36', fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="items"
                  stroke="#1A1F36"
                  strokeWidth={2}
                  dot={{ fill: '#1A1F36', r: 4 }}
                  name="Items"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent sessions table */}
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">Recent Sessions</h3>
          <DataTable<ScanSession>
            columns={columns}
            data={sessions}
            isLoading={isLoading}
            emptyMessage="No sessions found for this period."
            keyExtractor={(row) => row.id}
          />
        </div>
      </div>
    </div>
  );
}
