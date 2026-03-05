import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { BasketItem } from '@/lib/types';

const DEBOUNCE_MS = 1500;

interface BasketContextValue {
  items: BasketItem[];
  addItem: (ean: string) => boolean; // returns false if debounced
  removeItem: (id: string) => void;
  clearBasket: () => void;
  itemCount: number;
}

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const lastScanTimes = useRef<Map<string, number>>(new Map());

  const addItem = useCallback((ean: string): boolean => {
    const now = Date.now();
    const lastScan = lastScanTimes.current.get(ean);

    if (lastScan !== undefined && now - lastScan < DEBOUNCE_MS) {
      return false; // debounced — silent rejection
    }

    lastScanTimes.current.set(ean, now);

    setItems((prev) => [
      ...prev,
      {
        id: uuidv4(),
        ean,
        sequence: prev.length + 1,
        scannedAt: new Date(),
      },
    ]);
    return true;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      // Re-sequence after removal
      return filtered.map((item, idx) => ({ ...item, sequence: idx + 1 }));
    });
  }, []);

  const clearBasket = useCallback(() => {
    setItems([]);
    lastScanTimes.current.clear();
  }, []);

  return (
    <BasketContext.Provider
      value={{ items, addItem, removeItem, clearBasket, itemCount: items.length }}
    >
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket(): BasketContextValue {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error('useBasket must be used within BasketProvider');
  return ctx;
}
