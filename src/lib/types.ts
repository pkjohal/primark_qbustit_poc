export type UserRole = 'floor_colleague' | 'store_manager' | 'admin';
export type SessionStatus = 'completed' | 'cancelled';

export interface Store {
  id: string;
  name: string;
  store_code: string;
  region: string | null;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  store_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScanSession {
  id: string;
  session_number: string;
  user_id: string;
  store_id: string;
  item_count: number;
  qr_data: string | null;
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  user?: User;
  store?: Store;
}

export interface ScanItem {
  id: string;
  session_id: string;
  ean: string;
  sequence_number: number;
  scanned_at: string;
}

export interface AuditEntry {
  id: string;
  entity_type: 'session' | 'user' | 'store';
  entity_id: string;
  action: string;
  user_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: User;
}

// Client-side only — not persisted until QR generation
export interface BasketItem {
  id: string;       // Client-generated UUID for React list key
  ean: string;
  sequence: number;
  scannedAt: Date;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  floor_colleague: 'Floor Colleague',
  store_manager:   'Store Manager',
  admin:           'Administrator',
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  completed: 'Completed',
  cancelled: 'Cancelled',
};
