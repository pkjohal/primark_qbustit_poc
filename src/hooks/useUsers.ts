import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/lib/types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (storeId?: string, includeInactive = false) => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('name');
      if (storeId) query = query.eq('store_id', storeId);
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error: err } = await query;
      if (err) throw err;
      setUsers(data as User[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      setError(msg);
      console.error('useUsers error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllUsers = useCallback(async (includeInactive = false) => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('users')
        .select('*, store:stores(name)')
        .order('name');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error: err } = await query;
      if (err) throw err;
      setUsers(data as unknown as User[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = async (payload: {
    name: string;
    email: string;
    pin: string;
    store_id: string;
    role: UserRole;
  }): Promise<User> => {
    const { data, error: err } = await supabase
      .from('users')
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    return data as User;
  };

  const updateUser = async (id: string, payload: Partial<User>): Promise<void> => {
    const { error: err } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id);
    if (err) throw err;
  };

  const setUserActive = async (id: string, isActive: boolean): Promise<void> => {
    await updateUser(id, { is_active: isActive });
  };

  const countActiveAdmins = async (): Promise<number> => {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true);
    return count ?? 0;
  };

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    fetchAllUsers,
    createUser,
    updateUser,
    setUserActive,
    countActiveAdmins,
  };
}
