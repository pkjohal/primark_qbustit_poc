import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Store, User, UserRole } from '@/lib/types';

interface AuthContextValue {
  store: Store | null;
  user: User | null;
  isFloorColleague: boolean;
  isStoreManager: boolean;
  isAdmin: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageStores: boolean;
  canViewAllStores: boolean;
  login: (storeId: string, userId: string, pin: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hasRole(role: UserRole | undefined, ...roles: UserRole[]): boolean {
  return role !== undefined && roles.includes(role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);

  const login = useCallback(async (storeId: string, userId: string, pin: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .single();

      if (error || !data) return false;
      if (data.pin !== pin) return false;

      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError || !storeData) return false;

      setUser(data as User);
      setStore(storeData as Store);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStore(null);
  }, []);

  const role = user?.role;
  const isFloorColleague = hasRole(role, 'floor_colleague', 'store_manager', 'admin');
  const isStoreManager = hasRole(role, 'store_manager', 'admin');
  const isAdmin = hasRole(role, 'admin');

  return (
    <AuthContext.Provider
      value={{
        store,
        user,
        isFloorColleague,
        isStoreManager,
        isAdmin,
        canViewReports: isStoreManager,
        canManageUsers: isAdmin,
        canManageStores: isAdmin,
        canViewAllStores: isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
