import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/lib/utils';
import type { ScanSession, ScanItem } from '@/lib/types';

export default function BasketDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canViewReports } = useAuth();

  const [session, setSession] = useState<ScanSession | null>(null);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      supabase
        .from('scan_sessions')
        .select('*, user:users(id, name)')
        .eq('id', id)
        .single(),
      supabase
        .from('scan_items')
        .select('*')
        .eq('session_id', id)
        .order('sequence_number'),
    ]).then(async ([{ data: sessionData }, { data: itemsData }]) => {
      const s = sessionData as ScanSession | null;
      setSession(s);
      setItems((itemsData ?? []) as ScanItem[]);

      if (s?.qr_data) {
        const url = await QRCode.toDataURL(s.qr_data, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#1A1F36', light: '#ffffff' },
        });
        setQrDataUrl(url);
      }

      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="bg-light-grey min-h-full">
        <div className="bg-white border-b border-border-grey px-4 py-3 flex items-center gap-3">
          <div className="w-6 h-6 bg-light-grey rounded animate-pulse" />
          <div className="h-5 bg-light-grey rounded w-32 animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-xl p-4 animate-pulse h-24" />
          <div className="bg-white rounded-xl p-4 animate-pulse h-64" />
          <div className="bg-white rounded-xl p-4 animate-pulse h-40" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-light-grey min-h-full flex items-center justify-center p-8">
        <p className="text-mid-grey text-sm">Session not found.</p>
      </div>
    );
  }

  const colleague = (session.user as unknown as { name: string } | undefined)?.name;

  return (
    <div className="bg-light-grey min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-border-grey px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/baskets')}
          className="p-1 -ml-1 text-mid-grey hover:text-navy transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-navy leading-tight font-mono">
            {session.session_number}
          </h1>
          <p className="text-xs text-mid-grey">{formatDateTime(session.started_at)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {session.status === 'completed' ? (
            <CheckCircle size={16} className="text-success" />
          ) : (
            <XCircle size={16} className="text-danger" />
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            session.status === 'completed'
              ? 'bg-success-bg text-success'
              : 'bg-danger-bg text-danger'
          }`}>
            {session.status === 'completed' ? 'Completed' : 'Cancelled'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-xl p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-mid-grey">Items</span>
            <span className="font-medium text-navy">{session.item_count}</span>
          </div>
          {canViewReports && colleague && (
            <div className="flex justify-between">
              <span className="text-mid-grey">Colleague</span>
              <span className="font-medium text-navy">{colleague}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="bg-white rounded-xl p-4 flex flex-col items-center">
            <p className="text-sm font-semibold text-navy mb-3">QR Code</p>
            <div className="p-3 border-2 border-border-grey rounded-xl">
              <img src={qrDataUrl} alt="QR Code" width={240} height={240} className="rounded-lg" />
            </div>
            <p className="text-xs text-mid-grey mt-3 text-center">
              Show this to the checkout colleague
            </p>
          </div>
        )}

        {/* Items list */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-grey">
              <p className="text-sm font-semibold text-navy">Scanned Items</p>
            </div>
            <ul>
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center px-4 py-2.5 border-b border-border-grey/50 last:border-0"
                >
                  <span className="text-xs text-mid-grey w-6 shrink-0">{item.sequence_number}</span>
                  <span className="flex-1 font-mono text-sm text-charcoal tracking-wider">
                    {item.ean}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
