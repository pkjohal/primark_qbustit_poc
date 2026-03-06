import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/lib/utils';
import type { ScanSession } from '@/lib/types';

export default function BasketsScreen() {
  const navigate = useNavigate();
  const { user, store, canViewReports } = useAuth();
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !store) return;

    let query = supabase
      .from('scan_sessions')
      .select('*, user:users(id, name)')
      .order('started_at', { ascending: false })
      .limit(100);

    if (canViewReports) {
      query = query.eq('store_id', store.id);
    } else {
      query = query.eq('user_id', user.id);
    }

    query.then(({ data }) => {
      setSessions((data ?? []) as ScanSession[]);
      setLoading(false);
    });
  }, [user, store, canViewReports]);

  const subtitle = canViewReports
    ? `${store?.name} — all colleagues`
    : 'Your scan history';

  return (
    <div className="bg-light-grey min-h-full">
      <PageHeader title="Baskets" subtitle={subtitle} />

      <div className="p-4 space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-light-grey rounded w-24" />
                <div className="h-3 bg-light-grey rounded w-20" />
              </div>
              <div className="h-3 bg-light-grey rounded w-36" />
            </div>
          ))
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={40} />}
            message="No baskets yet — scan some items to get started"
          />
        ) : (
          sessions.map((session) => {
            const colleague = (session.user as unknown as { name: string } | undefined)?.name;
            return (
              <div
              key={session.id}
              onClick={() => navigate(`/baskets/${session.id}`)}
              className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:bg-light-grey/50 active:scale-[0.99] transition-all"
            >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-navy">
                      {session.session_number}
                    </span>
                    {session.status === 'completed' ? (
                      <CheckCircle size={14} className="text-success" />
                    ) : (
                      <XCircle size={14} className="text-danger" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-mid-grey">
                      {formatRelativeTime(session.started_at)}
                    </span>
                    <ChevronRight size={14} className="text-mid-grey" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-charcoal">
                    {session.item_count} {session.item_count === 1 ? 'item' : 'items'}
                    {canViewReports && colleague && (
                      <span className="text-mid-grey"> · {colleague}</span>
                    )}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    session.status === 'completed'
                      ? 'bg-success-bg text-success'
                      : 'bg-danger-bg text-danger'
                  }`}>
                    {session.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
