-- ============================================
-- Primark Qbust.it POC — Database Schema
-- Run in order: schema.sql → indexes.sql → seed.sql
-- ============================================

-- TABLE 1: stores (no dependencies)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  store_code TEXT UNIQUE NOT NULL,
  region TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 2: users (depends on: stores)
-- NOTE: PINs are stored in PLAINTEXT for POC simplicity.
-- Phase 3 (SSO migration) will replace PIN auth entirely.
-- If PINs are retained as a fallback, they must be hashed (bcrypt).
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL CHECK (length(pin) = 4 AND pin ~ '^[0-9]+$'),
  store_id UUID REFERENCES stores(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'floor_colleague'
    CHECK (role IN ('floor_colleague', 'store_manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 3: scan_sessions (depends on: users, stores)
-- Each session = one customer basket interaction.
-- Sessions are only inserted on QR generation (status='completed')
-- or explicit cancellation (status='cancelled').
-- There is no 'in_progress' database state; in-progress baskets
-- exist only in client-side React state.
CREATE TABLE scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  qr_data TEXT,              -- Full QR string: LIST_EAN1_EAN2_...
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ   -- Set when QR code is generated
);

-- TABLE 4: scan_items (depends on: scan_sessions)
CREATE TABLE scan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES scan_sessions(id) ON DELETE CASCADE NOT NULL,
  ean TEXT NOT NULL CHECK (length(ean) = 13 AND ean ~ '^[0-9]+$'),
  sequence_number INTEGER NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 5: audit_log (depends on: users)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL
    CHECK (entity_type IN ('session', 'user', 'store')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,       -- 'created', 'completed', 'cancelled', etc.
  user_id UUID REFERENCES users(id) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Session Number Generation
-- Format: QB-YYYYMMDD-XXXX
-- ============================================
CREATE SEQUENCE session_daily_seq START 1;

CREATE OR REPLACE FUNCTION generate_session_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT := to_char(now(), 'YYYYMMDD');
  seq_val INTEGER;
BEGIN
  seq_val := nextval('session_daily_seq');
  RETURN 'QB-' || today || '-' || lpad(seq_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- updated_at Trigger for users
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
