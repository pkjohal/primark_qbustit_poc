import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAudit } from './useAudit';
import type { BasketItem, ScanSession } from '@/lib/types';

export function useScanSession() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { logEvent } = useAudit();

  const saveSession = async (
    items: BasketItem[],
    userId: string,
    storeId: string,
    qrData: string,
    startedAt: Date
  ): Promise<ScanSession> => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Generate session number via Postgres function
      const { data: sessionNumData, error: seqError } = await supabase
        .rpc('generate_session_number');
      if (seqError) throw seqError;
      const sessionNumber = sessionNumData as string;

      const now = new Date().toISOString();

      // Insert session
      const { data: sessionData, error: sessionError } = await supabase
        .from('scan_sessions')
        .insert({
          session_number: sessionNumber,
          user_id: userId,
          store_id: storeId,
          item_count: items.length,
          qr_data: qrData,
          status: 'completed',
          started_at: startedAt.toISOString(),
          completed_at: now,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      const session = sessionData as ScanSession;

      // Bulk insert scan items
      const scanItems = items.map((item) => ({
        session_id: session.id,
        ean: item.ean,
        sequence_number: item.sequence,
        scanned_at: item.scannedAt.toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from('scan_items')
        .insert(scanItems);
      if (itemsError) throw itemsError;

      // Audit log
      await logEvent('session', session.id, 'completed', userId);

      return session;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save session';
      setSaveError(msg);
      console.error('useScanSession.saveSession error:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const cancelSession = async (
    items: BasketItem[],
    userId: string,
    storeId: string,
    startedAt: Date
  ): Promise<void> => {
    if (items.length === 0) return; // Only record non-empty cancelled baskets

    try {
      const { data: sessionNumData } = await supabase.rpc('generate_session_number');
      const sessionNumber = sessionNumData as string;

      const { data: sessionData, error: sessionError } = await supabase
        .from('scan_sessions')
        .insert({
          session_number: sessionNumber,
          user_id: userId,
          store_id: storeId,
          item_count: items.length,
          qr_data: null,
          status: 'cancelled',
          started_at: startedAt.toISOString(),
          completed_at: null,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      const session = sessionData as ScanSession;

      await logEvent('session', session.id, 'cancelled', userId);
    } catch (err) {
      console.error('useScanSession.cancelSession error:', err);
    }
  };

  return { saveSession, cancelSession, isSaving, saveError };
}
