import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Store } from '@/lib/types';

export function useStores(includeInactive = false) {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from('stores').select('*').order('name');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error: err } = await query;
      if (err) throw err;
      setStores(data as Store[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load stores';
      setError(msg);
      console.error('useStores error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const createStore = async (payload: {
    name: string;
    store_code: string;
    region: string;
  }): Promise<Store | null> => {
    const { data, error: err } = await supabase
      .from('stores')
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    await fetchStores();
    return data as Store;
  };

  const updateStore = async (id: string, payload: Partial<Store>): Promise<void> => {
    const { error: err } = await supabase
      .from('stores')
      .update(payload)
      .eq('id', id);
    if (err) throw err;
    await fetchStores();
  };

  const setStoreActive = async (id: string, isActive: boolean): Promise<void> => {
    await updateStore(id, { is_active: isActive });
  };

  return { stores, isLoading, error, refetch: fetchStores, createStore, updateStore, setStoreActive };
}
