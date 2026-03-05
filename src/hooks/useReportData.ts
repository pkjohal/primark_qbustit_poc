import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatShortDate } from '@/lib/utils';
import { parseISO, format } from 'date-fns';
import type { ScanSession } from '@/lib/types';

interface ReportFilters {
  from: Date;
  to: Date;
  storeId?: string;
  userId?: string;
}

interface ReportStats {
  totalItems: number;
  totalSessions: number;
  avgItemsPerSession: number;
}

interface DayData {
  date: string;
  sessions: number;
  items: number;
}

interface UseReportDataReturn {
  stats: ReportStats;
  chartData: DayData[];
  sessions: ScanSession[];
  isLoading: boolean;
  filters: ReportFilters;
  setFilters: (f: ReportFilters) => void;
}

const defaultFilters = (): ReportFilters => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from, to };
};

export function useReportData(defaultStoreId?: string): UseReportDataReturn {
  const [filters, setFilters] = useState<ReportFilters>({
    ...defaultFilters(),
    storeId: defaultStoreId,
  });
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('scan_sessions')
        .select('*, user:users(name, store_id)')
        .eq('status', 'completed')
        .gte('started_at', filters.from.toISOString())
        .lte('started_at', filters.to.toISOString())
        .order('started_at', { ascending: false })
        .limit(20);

      if (filters.storeId) {
        query = query.eq('store_id', filters.storeId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSessions((data ?? []) as ScanSession[]);
    } catch (err) {
      console.error('useReportData fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription — new completed sessions
  useEffect(() => {
    const channel = supabase
      .channel('report_sessions_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scan_sessions',
          filter: 'status=eq.completed',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Compute stats
  const totalItems = sessions.reduce((sum, s) => sum + s.item_count, 0);
  const totalSessions = sessions.length;
  const avgItemsPerSession =
    totalSessions > 0 ? Math.round((totalItems / totalSessions) * 10) / 10 : 0;

  const stats: ReportStats = { totalItems, totalSessions, avgItemsPerSession };

  // Build chart data grouped by day
  const dayMap = new Map<string, DayData>();
  for (const session of sessions) {
    const day = format(parseISO(session.started_at), 'dd/MM');
    const existing = dayMap.get(day) ?? { date: day, sessions: 0, items: 0 };
    dayMap.set(day, {
      date: day,
      sessions: existing.sessions + 1,
      items: existing.items + session.item_count,
    });
  }
  const chartData = Array.from(dayMap.values()).reverse();

  return { stats, chartData, sessions, isLoading, filters, setFilters };
}

// Re-export for use in components
export type { ReportFilters, ReportStats, DayData };
// Suppress unused import warning
void formatShortDate;
