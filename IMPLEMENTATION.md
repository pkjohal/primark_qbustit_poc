# Primark Qbust.it POC — Implementation Plan

## Overview

Qbust.it is a mobile queue-busting application for Primark store colleagues. Colleagues scan customer items on the shop floor using EAN-13 barcodes, generating a single QR code representing the entire basket. At the checkout, the till colleague scans the QR code to process all items instantly.

This document is the authoritative implementation guide for the POC build.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Tech Stack](#2-tech-stack)
3. [Supabase & Database](#3-supabase--database)
4. [File Structure](#4-file-structure)
5. [Brand Design System](#5-brand-design-system)
6. [TypeScript Types](#6-typescript-types)
7. [Core Logic & Utilities](#7-core-logic--utilities)
8. [Hooks](#8-hooks)
9. [Context Providers](#9-context-providers)
10. [Components](#10-components)
11. [Screens](#11-screens)
12. [Routing & Auth Guards](#12-routing--auth-guards)
13. [Business Rules](#13-business-rules)
14. [Error Handling](#14-error-handling)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Build Order](#16-build-order)

---

## 1. Project Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier sufficient for POC)

### Initialise Project

```bash
npm create vite@latest primark-qbustit-poc -- --template react-ts
cd primark-qbustit-poc
npm install
```

### Install Dependencies

```bash
# Core
npm install react-router-dom @supabase/supabase-js

# Barcode / QR
npm install html5-qrcode qrcode
npm install -D @types/qrcode

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Charts & dates
npm install recharts date-fns

# Icons
npm install lucide-react

# UUID (for client-side basket item IDs)
npm install uuid
npm install -D @types/uuid
```

### Environment Variables

Create `.env.local` (copy from `.env.example`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`.env.example` should contain the above keys with empty values, committed to the repo.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + TypeScript | SPA, mobile-first |
| Styling | Tailwind CSS | Custom Primark brand tokens |
| Barcode Scanning | html5-qrcode | EAN-13 via MediaDevices API |
| QR Code Generation | qrcode (npm) | Client-side, LIST_ format |
| Backend / DB | Supabase (Postgres) | Auth, Realtime, storage |
| Charts | Recharts | Bar + line charts |
| Date Utilities | date-fns | Formatting, relative time |
| Routing | React Router v6 | Protected routes |
| Icons | lucide-react | Scan, BarChart3, Settings icons |
| Hosting | Vercel / Netlify / Vite dev | Lightweight POC hosting |

---

## 3. Supabase & Database

### 3.1 Setup Order

Run SQL files against your Supabase project **in this exact order**:

1. `supabase/schema.sql` — Tables, functions, triggers
2. `supabase/indexes.sql` — Performance indexes
3. `supabase/seed.sql` — Stores, users, sample sessions

### 3.2 Schema (`supabase/schema.sql`)

Tables must be created in dependency order:

```sql
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
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL CHECK (length(pin) = 4 AND pin ~ '^[0-9]+$'),
  -- POC: PINs stored in PLAINTEXT. Phase 3 (SSO) replaces PIN auth.
  -- If PINs are retained as fallback, they MUST be hashed (bcrypt).
  store_id UUID REFERENCES stores(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'floor_colleague'
    CHECK (role IN ('floor_colleague', 'store_manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 3: scan_sessions (depends on: users, stores)
-- Each session = one customer basket interaction
CREATE TABLE scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  qr_data TEXT,             -- Full QR string: LIST_EAN1_EAN2_...
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'cancelled')),
  -- Sessions are only inserted on QR generation (status='completed')
  -- or explicit cancellation (status='cancelled').
  -- No 'in_progress' DB state — in-progress baskets live in React state only.
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ  -- Set when QR code is generated
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
  action TEXT NOT NULL,      -- 'created', 'completed', 'cancelled', etc.
  user_id UUID REFERENCES users(id) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Postgres Functions & Triggers

```sql
-- Session number: QB-YYYYMMDD-XXXX
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

-- updated_at trigger for users
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
```

### 3.4 Indexes (`supabase/indexes.sql`)

```sql
CREATE INDEX idx_sessions_store   ON scan_sessions(store_id, status);
CREATE INDEX idx_sessions_user    ON scan_sessions(user_id);
CREATE INDEX idx_sessions_started ON scan_sessions(started_at);
CREATE INDEX idx_sessions_status  ON scan_sessions(status);
CREATE INDEX idx_items_session    ON scan_items(session_id);
CREATE INDEX idx_items_ean        ON scan_items(ean);
CREATE INDEX idx_audit_entity     ON audit_log(entity_type, entity_id);
CREATE INDEX idx_users_store      ON users(store_id, is_active);
```

### 3.5 Seed Data (`supabase/seed.sql`)

Seed data includes completed sessions so the Reports dashboard is populated on first run.

**Stores:**

```sql
INSERT INTO stores (id, name, store_code, region) VALUES
('a0000001-0000-0000-0000-000000000001', 'Manchester Arndale',   'MAN01', 'North West'),
('a0000001-0000-0000-0000-000000000002', 'Birmingham Primark',   'BHM01', 'West Midlands'),
('a0000001-0000-0000-0000-000000000003', 'London Oxford Street', 'LON01', 'London'),
('a0000001-0000-0000-0000-000000000004', 'Leeds White Rose',     'LDS01', 'Yorkshire'),
('a0000001-0000-0000-0000-000000000005', 'Dublin Mary Street',   'DUB01', 'Ireland');
```

**Default Logins:**

| Name    | Store               | Role             | PIN  |
|---------|---------------------|------------------|------|
| Sarah K | Manchester Arndale  | Floor Colleague  | 1234 |
| Tom B   | Manchester Arndale  | Store Manager    | 5678 |
| Amy L   | Birmingham Primark  | Floor Colleague  | 1234 |
| James R | Birmingham Primark  | Store Manager    | 5678 |
| Dan M   | London Oxford St    | Admin            | 4567 |

**Users:**

```sql
INSERT INTO users (id, name, email, pin, store_id, role) VALUES
('d0000001-0000-0000-0000-000000000001', 'Sarah K', 'sarah.k@primark.com', '1234',
  'a0000001-0000-0000-0000-000000000001', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000002', 'Tom B',   'tom.b@primark.com',   '5678',
  'a0000001-0000-0000-0000-000000000001', 'store_manager'),
('d0000001-0000-0000-0000-000000000003', 'Amy L',   'amy.l@primark.com',   '1234',
  'a0000001-0000-0000-0000-000000000002', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000004', 'James R', 'james.r@primark.com', '5678',
  'a0000001-0000-0000-0000-000000000002', 'store_manager'),
('d0000001-0000-0000-0000-000000000005', 'Dan M',   'dan.m@primark.com',   '4567',
  'a0000001-0000-0000-0000-000000000003', 'admin');
```

**Seed Sessions** (6 completed sessions across 3 days for report testing — full SQL in `supabase/seed.sql`).

### 3.6 Supabase Realtime

Enable Realtime on the `scan_sessions` table only. The `useReportData` hook subscribes to `postgres_changes` for `INSERT` events filtered to `status = 'completed'`. No other tables require Realtime.

---

## 4. File Structure

```
/src
  /components
    /ui          → StatCard, PinPad, ConfirmDialog, EmptyState,
                   Toast, DateRangePicker, DataTable, ZoomSlider
    /layout      → NavBar, BottomNav, PageHeader
    /scanning    → BarcodeScanner, BasketList, ItemCountBadge,
                   QrCodeDisplay
  /screens
    LoginScreen.tsx
    ScanScreen.tsx
    QrDisplayScreen.tsx    (modal, not a route)
    ReportsScreen.tsx
    AdminScreen.tsx
  /hooks
    useAuth.ts
    useBasket.ts           → Client-side basket state
    useScanSession.ts      → Supabase persistence
    useCamera.ts           → Camera access, zoom, lifecycle
    useBarcodeScanner.ts   → EAN-13 detection + validation
    useQrGenerator.ts      → QR code generation
    useReportData.ts       → Report queries + realtime
    useStores.ts
    useUsers.ts
    useAudit.ts
    useToast.ts
  /lib
    supabase.ts            → Supabase client init
    types.ts               → All TypeScript types and constants
    ean13.ts               → EAN-13 validation utility
    qrFormat.ts            → LIST_ string builder and parser
    utils.ts               → formatDate, formatRelativeTime, etc.
  /context
    AuthContext.tsx
    ToastContext.tsx
    BasketContext.tsx       → Basket state provider (survives tab nav)
  App.tsx
  main.tsx
  index.css                → Tailwind imports + custom CSS

/supabase
  schema.sql
  seed.sql
  indexes.sql

tailwind.config.js
postcss.config.js
vite.config.ts
package.json
tsconfig.json
README.md
.env.example
```

---

## 5. Brand Design System

### 5.1 Tailwind Config (`tailwind.config.js`)

```js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primark: {
          blue:        '#0DAADB',
          'blue-dark': '#0987A8',
          'blue-light':'#E6F7FB',
        },
        navy:          '#1A1F36',
        charcoal:      '#374151',
        'mid-grey':    '#6B7280',
        'light-grey':  '#F3F4F6',
        'border-grey': '#E5E7EB',
        success: { DEFAULT: '#10B981', bg: '#ECFDF5' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB' },
        danger:  { DEFAULT: '#EF4444', bg: '#FEF2F2' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 5.2 Typography Scale

| Usage | Size | Weight | Notes |
|---|---|---|---|
| Page title | 24px | 700 | |
| Section heading | 18px | 600 | |
| Card title | 16px | 600 | |
| Body text | 15px | 400 | |
| Caption / label | 13px | 500 | Uppercase, letter-spacing 0.05em |
| Large stat number | 36–48px | 700 | |
| Table text | 14px | 400 | |

### 5.3 Spacing & Layout

| Token | Value |
|---|---|
| Page padding (mobile) | 16px |
| Page padding (tablet+) | 24px |
| Card padding | 16px |
| Card border-radius | 12px |
| Card shadow | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` |
| Gap between cards | 12px |
| Button min-height | 48px |
| Input min-height | 44px |
| Button border-radius | 8px |
| Bottom nav height | 64px |
| Top nav height | 56px |

### 5.4 Component Style Reference

**NavBar (Top):** Height 56px, background `navy`. Left: "PRIMARK" (uppercase, letter-spacing 0.15em, weight 700, colour `primark-blue`) + "Qbust.it" subtitle in `mid-grey`. Right: user name, store name, logout icon.

**Bottom Nav:** Height 64px, white background, `border-grey` top border. Active tab: `primark-blue` icon + label. Inactive: `mid-grey`.

**Primary Button:** `primark-blue` background, white text, weight 600, full-width on mobile. Used for "Generate QR Code", "Print".

**Secondary Button:** White background, `border-grey` border, `charcoal` text. Used for "Clear Basket", "Cancel", "New Basket".

**Danger Button:** `danger` background (#EF4444), white text. Used for "Discard Basket" confirmations.

**Item Count Badge:** Floating pill, `primark-blue` background, white text, `border-radius: 9999px`, min-width 48px, 18px/700.

---

## 6. TypeScript Types

**File: `src/lib/types.ts`**

```typescript
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
```

---

## 7. Core Logic & Utilities

### 7.1 EAN-13 Validation (`src/lib/ean13.ts`)

Validate client-side before adding to basket. Algorithm:
1. Take the first 12 digits.
2. Sum digits at odd positions (1st, 3rd, 5th, ...) with weight 1.
3. Sum digits at even positions (2nd, 4th, 6th, ...) with weight 3.
4. `check = (10 - (sum % 10)) % 10`
5. The 13th digit must equal the calculated check digit.

```typescript
export function validateEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) =>
    acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === digits[12];
}
```

### 7.2 QR Format (`src/lib/qrFormat.ts`)

```typescript
// Build QR string from basket
export function buildQrString(eans: string[]): string {
  return `LIST_${eans.join('_')}`;
}

// Parse QR string back to EANs (for testing/debugging)
export function parseQrString(qr: string): string[] {
  if (!qr.startsWith('LIST_')) throw new Error('Invalid QR format');
  return qr.slice(5).split('_');
}

// QR capacity check: ~4,296 alphanumeric chars, warn at 280 items
export const QR_ITEM_LIMIT = 280;

export function exceedsQrLimit(eans: string[]): boolean {
  return buildQrString(eans).length > 4296;
}
```

### 7.3 Scan Confirmation Sound

Use Web Audio API — no audio file dependency. Create a shared `AudioContext` once on first user interaction (satisfies browser autoplay policy).

```typescript
// src/lib/audio.ts
let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playBeep(): void {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.type = 'square';
  oscillator.frequency.value = 1800;
  gainNode.gain.setValueAtTime(0.3, context.currentTime);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.08); // 80ms beep
}
```

### 7.4 Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 7.5 Utilities (`src/lib/utils.ts`)

Implement:
- `formatDate(iso: string): string` — formatted display date
- `formatRelativeTime(iso: string): string` — "2 hours ago" for <7 days, absolute date otherwise
- `formatDateTime(iso: string): string` — date + time string

---

## 8. Hooks

### `useAuth.ts`

- Manages `store`, `user` state in React state only (no localStorage — page refresh requires re-login).
- `login(storeId, userId, pin)`: queries Supabase `users` table, verifies PIN, sets auth state, returns `boolean`.
- `logout()`: clears state, navigates to `/login`.
- Exposes computed flags: `isFloorColleague`, `isStoreManager`, `isAdmin`, `canViewReports`, `canManageUsers`, `canManageStores`, `canViewAllStores`.

```typescript
interface AuthContext {
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
```

### `useBasket.ts`

Client-side basket state. Methods: `addItem(ean)`, `removeItem(id)`, `clearBasket()`. Debounce: reject the same EAN within 1.5 seconds. State lives in `BasketContext` so it persists across tab navigation.

### `useScanSession.ts`

Supabase persistence. Methods:
- `saveSession(items, userId, storeId, qrData)` — calls `generate_session_number()`, inserts `scan_sessions`, bulk-inserts `scan_items`, creates `audit_log` entry. Returns saved session.
- `cancelSession(items, userId, storeId)` — inserts `scan_sessions` with `status='cancelled'`, creates `audit_log` entry. Only called if basket is non-empty.

No database interaction occurs during scanning — all state is client-side until this step.

### `useCamera.ts`

- Accesses rear camera via `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`.
- Default zoom: 2x via `MediaTrackConstraints.advanced[{ zoom: 2.0 }]`.
- If zoom not supported (iOS Safari or some Android): hide zoom slider, show info note "Zoom not supported on this device — move closer to scan."
- Detects lost stream when app returns to foreground; auto-reinitialises camera.
- On reinitialisation failure: shows "Camera unavailable — tap to retry" overlay with retry button.
- Re-initialises camera when navigating back to the Scan tab.
- Exposes: `stream`, `zoomRange`, `currentZoom`, `setZoom`, `torchEnabled`, `toggleTorch`, `cameraError`, `retryCamera`.

### `useBarcodeScanner.ts`

- Wraps `html5-qrcode` (or ZXing-js) to detect EAN-13 barcodes from the camera stream.
- Filters to EAN-13 format only — rejects other barcode formats.
- On successful decode: validates check digit via `validateEan13()`, plays beep, adds to basket, triggers `navigator.vibrate(100)` where supported.
- On invalid barcode: fires `onError` callback with message "Invalid barcode — please try again."
- Applies 1.5-second debounce per EAN to prevent accidental rapid double-scans.

### `useQrGenerator.ts`

- Uses the `qrcode` npm package to render QR code to a `<canvas>` element.
- Input: `buildQrString(eans)` result.
- Configuration: error correction level M, output size 280×280px.
- Also produces a base64 data URL for potential printing.
- Validates against `exceedsQrLimit()` before generating — throws if over limit.

### `useReportData.ts`

- Queries `scan_sessions` with `status='completed'` and joins `users`.
- Filters by date range, store (admin only), and optional colleague.
- Computes: total items, total sessions, average items per session.
- Groups by day for chart data.
- Subscribes to Supabase Realtime `postgres_changes` INSERT on `scan_sessions` (filter: `status=eq.completed`) to update dashboard without manual refresh.
- Returns: `stats`, `chartData`, `sessions`, `isLoading`, `setFilters`.

### `useStores.ts`

Fetches active stores for the login screen dropdown. Fetches all stores (including inactive) for admin management.

### `useUsers.ts`

Fetches users by store for login screen. Admin: fetches all users. Exposes `createUser`, `updateUser`, `setUserActive`.

### `useAudit.ts`

Exposes `logEvent(entityType, entityId, action, userId, metadata?)`. Inserts into `audit_log`.

### `useToast.ts`

Manages toast queue. Exposes `showToast(message, variant: 'success' | 'error' | 'warning')`. Auto-dismiss after 5 seconds.

---

## 9. Context Providers

### `AuthContext.tsx`

Wraps the entire app. Provides `useAuth` hook. Stores `user` and `store` in React state. No localStorage — page refresh clears session.

### `BasketContext.tsx`

Wraps the app below `AuthContext`. Stores `BasketItem[]` in React state. Provides `useBasket` hook. Basket persists across tab navigation (Scan → Reports → Scan). Basket is cleared on:
- QR code generation
- Explicit "Clear All" / "Discard"
- Logout
- Page refresh

### `ToastContext.tsx`

Wraps the app. Renders a toast stack fixed to the top/bottom of the viewport. Provides `useToast` hook.

**App.tsx provider order:**

```tsx
<ToastContext>
  <AuthContext>
    <BasketContext>
      <RouterProvider />
    </BasketContext>
  </AuthContext>
</ToastContext>
```

---

## 10. Components

### Layout Components (`src/components/layout/`)

**`<NavBar>`**
- Height: 56px, background: `navy`.
- Left: "PRIMARK" (uppercase, letter-spacing 0.15em, 700, `primark-blue`) + "Qbust.it" (`mid-grey`, 14px).
- Right: user name + store name + logout icon button.
- Props: none (reads from `AuthContext`).

**`<BottomNav>`**
- Height: 64px, white, `border-grey` top border.
- Tabs based on role: `floor_colleague` → Scan only; `store_manager` → Scan + Reports; `admin` → Scan + Reports + Admin.
- Icons: `ScanBarcode`, `BarChart3`, `Settings` (from lucide-react).
- Active: `primark-blue`. Inactive: `mid-grey`.
- Hidden when QR modal is displayed.

**`<PageHeader>`**
- Title + optional subtitle + optional action button(s) on the right.

### UI Components (`src/components/ui/`)

**`<PinPad>`**
- 4-digit numpad grid. Buttons 64×64px minimum.
- Displays 4 dots filling left-to-right as digits entered.
- Props: `onComplete(pin: string)`, `onClear()`.
- Triggers shake + error text on incorrect PIN (controlled by parent).

**`<StatCard>`**
- Large number (36–48px, 700) + label (13px, uppercase) + `primark-blue` accent.
- Props: `value: string | number`, `label: string`, `colour?: string`.
- Skeleton loader variant for loading state.

**`<DateRangePicker>`**
- From/to date inputs. Default: last 7 days.
- Props: `from: Date`, `to: Date`, `onChange(from, to)`.

**`<DataTable>`**
- Sortable columns, default sort `started_at DESC`, shows 20 rows.
- Props: `columns`, `data`, `sortBy`, `onSort`.
- Empty state: `<EmptyState>` with message "No sessions found for this period."

**`<ConfirmDialog>`**
- Modal with title, message, Cancel (secondary) + Confirm button.
- Props: `title`, `message`, `confirmLabel`, `variant: 'default' | 'danger'`, `onConfirm`, `onCancel`, `isOpen`.

**`<EmptyState>`**
- Lucide icon + message + optional CTA button.
- Props: `icon`, `message`, `ctaLabel?`, `onCta?`.

**`<Toast>`**
- Success/error/warning variants. Auto-dismiss 5s. Rendered via `ToastContext`.

**`<ZoomSlider>`**
- Horizontal slider. `primark-blue` thumb.
- Props: `min`, `max`, `value`, `onChange`.
- Hidden if zoom not supported.

### Scanning Components (`src/components/scanning/`)

**`<BarcodeScanner>`**
- Camera viewfinder (rear camera, 60% screen height).
- Semi-transparent targeting overlay rectangle in centre.
- Zoom slider at bottom of viewfinder (hidden if not supported).
- Item count badge: top-right, floating.
- Torch toggle: top-left.
- Props: `onScan(ean: string)`, `onError(msg: string)`, `defaultZoom?: number`.

**`<BasketList>`**
- Scrollable list panel (40% screen height), white card with rounded top corners, sheet-style overlap.
- Header: "Scanned Items" + "Clear All" button (danger colour when items exist).
- Each row: sequence number (grey) + EAN in monospace + × remove button (red on tap).
- Empty state: barcode icon + "Scan items to get started".
- Footer: "Generate QR Code (N items)" button (primary, disabled when empty).
- Props: `items: BasketItem[]`, `onRemove(id: string)`, `onClear()`, `onGenerate()`.

**`<ItemCountBadge>`**
- Floating pill, `primark-blue`, white text, bold.
- Shows "N items".
- Props: `count: number`.

**`<QrCodeDisplay>`**
- Renders QR data to `<canvas>` element (280×280px, error correction M).
- Returns `canvasRef` and `dataUrl`.
- Props: `data: string`, `size?: number`.

---

## 11. Screens

### `LoginScreen.tsx`

**Layout:** Full-screen gradient background (`from-navy to-primark-blue`). White `rounded-2xl shadow-2xl` card centred on screen (`max-w-sm`). Footer text "Internal use only • Staff members only" in `white/50` below the card.

**Branding (above card):**
- "PRIMARK" in `primark-blue`, uppercase, `tracking-[0.2em]`, 42px, weight 700.
- "Qbust.it — Queue Busting" subtitle in `white/70`, 14px, below.

**Login flow — 3 steps (progressive, single card):**

A `step` variable (`'store' | 'user' | 'pin'`) controls which step is displayed inside the card. Steps advance automatically on selection; back buttons allow reverting.

**Step 1 — Store selection:**
- Heading: "Select Your Store" (`text-xl font-bold text-navy`).
- `<select>` dropdown: active stores only, ordered alphabetically. Placeholder option "Select a store…". Styled: `border-2 border-border-grey rounded-xl px-4 py-3 text-[15px] text-charcoal focus:border-primark-blue focus:ring-2 focus:ring-primark-blue/20`.
- On selection → fetch users for that store, advance to step 2.

**Step 2 — User selection:**
- Heading: "Select Your Name". Store name shown as subtitle in `mid-grey`.
- Spinner while users load (`border-t-primark-blue animate-spin`).
- `<select>` dropdown: active users for selected store, ordered alphabetically. Same styling as store dropdown.
- On selection → advance to step 3.
- "← Back to Store Selection" link button (`text-primark-blue hover:bg-primark-blue-light`).

**Step 3 — PIN entry:**
- Heading: "Enter Your PIN". User's name shown as subtitle in `mid-grey`.
- PIN dot indicators: 4 dots in a row (`gap-5`). Filled dot: `bg-navy border-navy scale-110`. Empty dot: `bg-transparent border-mid-grey`. The dot row receives a `shake` animation CSS class on incorrect PIN.
- Number pad: 3-column grid, buttons `h-14 rounded-xl bg-light-grey hover:bg-border-grey active:scale-95 text-xl font-semibold text-navy`. Layout: 1–9, then `[empty] [0] [delete]`. Delete button shows `<Delete>` lucide icon.
- **Auto-submits on 4th digit** — no submit button needed.
- Correct PIN → `login(storeId, userId, pin)` → navigate to `/scan`.
- Incorrect PIN → shake animation on dots, "Incorrect PIN. Please try again." error in `danger` red, PIN cleared after 600ms.
- "← Back to Name Selection" link button.

**Shake animation (inline `<style>`):**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}
```

**Data fetching:**
- Stores: `supabase.from('stores').select('*').eq('is_active', true).order('name')`
- Users: `supabase.from('users').select('*').eq('store_id', storeId).eq('is_active', true).order('name')`
- No separate PIN verification query — PIN is verified via `useAuth.login(storeId, userId, pin)` which returns `Promise<boolean>`.

### `ScanScreen.tsx`

The main working screen. Fills viewport between NavBar and BottomNav.

- Top 60%: `<BarcodeScanner>` with live camera feed, targeting overlay, zoom slider, `<ItemCountBadge>`, torch toggle.
- Bottom 40%: `<BasketList>` as a sheet-style white card.
- "Clear All" triggers `<ConfirmDialog>` with "Are you sure? This will clear X items." / "Discard" (danger).
- "Generate QR Code" triggers QR generation and opens the QR modal (`showQrModal: boolean` state).
- QR modal rendered as `<QrDisplayModal>` overlay within this screen (not a separate route).

### QR Display Modal (within `ScanScreen.tsx`)

- Full-screen modal overlay, white background.
- Green checkmark icon + "QR Code Ready" heading.
- QR code image: centred, 280×280px, generous padding.
- Session summary card: session number, item count, date/time.
- "Print" button (primary): shows toast "Printing is not available in this version."
- "New Basket" button (secondary): clears basket, closes modal, camera re-initialises.
- Session is saved to Supabase when this modal opens (not before).

### `ReportsScreen.tsx`

Access: `store_manager`, `admin` only.

- Filter bar: date range pickers (default last 7 days), store dropdown (admin only), colleague dropdown.
- 3 `<StatCard>` components (horizontal scroll on mobile): Total Items Scanned, QR Codes Generated, Avg Items per QR.
- Skeleton loaders while data loads.
- Bar chart (Recharts): QR codes per day, bar colour `#0DAADB`.
- Line chart (Recharts): items scanned per day, line colour `#1A1F36`.
- `<DataTable>` of recent sessions: Session #, Colleague, Items, Time.
- Real-time updates via `useReportData` subscription.

### `AdminScreen.tsx`

Access: `admin` only. Tabs: Users | Stores.

**Users Tab:**
- Table: name, email, store, role, status pill (Active/Inactive), created date.
- "Add User" button → modal with `<PinPad>` for PIN, name, email, store dropdown, role dropdown.
- Row actions: "Edit" (same modal), "Deactivate"/"Activate" toggle.
- Deactivated users shown greyed out.
- Cannot deactivate last admin user.

**Stores Tab:**
- Table: name, store code, region, status, user count.
- "Add Store" button → modal: name, store code (unique), region.
- Row actions: "Edit", "Deactivate"/"Activate" toggle.

**Validation (both tabs):**
- Unique store codes and emails enforced.
- PIN: exactly 4 digits.
- Name: minimum 2 characters.
- Email: valid format.
- Store + role: required.
- Inline validation errors on all fields.

---

## 12. Routing & Auth Guards

```
/login        → LoginScreen (public)
/scan         → ScanScreen (all authenticated roles)
/reports      → ReportsScreen (store_manager, admin)
/admin        → AdminScreen (admin only)
/admin/users  → AdminScreen - Users tab
/admin/stores → AdminScreen - Stores tab
```

**Guards:**
- All routes except `/login` redirect to `/login` if not authenticated.
- `/reports` redirects to `/scan` (with toast) if `!canViewReports`.
- `/admin/*` redirects to `/scan` (with toast) if `!isAdmin`.
- After login, all roles land on `/scan`.

**QR Display is not a route.** It is a full-screen modal within `ScanScreen.tsx`, controlled by `showQrModal: boolean` local state. This avoids routing issues since the session may not have a database ID at the point of display.

---

## 13. Business Rules

| Rule | Detail |
|---|---|
| Session numbers | Auto-generated by Postgres function `generate_session_number()`. Format: `QB-YYYYMMDD-XXXX`. |
| QR format | Fixed: `LIST_EAN1_EAN2_EAN3_...`. The `LIST` prefix is required — EPOS depends on it. |
| EAN validation | 13-digit format + valid check digit, validated client-side before adding to basket. |
| Duplicate EANs | Allowed. Debounce (1.5s) prevents accidental rapid re-scan of the same EAN. |
| Basket minimum | At least 1 item required before "Generate QR Code" is enabled. |
| QR capacity | Warn and block generation if basket exceeds ~280 items / ~4,296 characters. |
| Session persistence | No DB writes during scanning. Basket lives in React context. Written to DB only on QR generation or explicit cancellation. |
| Completed sessions | Immutable. Cannot be modified after QR generation. |
| Cancelled sessions | Recorded only if basket is non-empty at time of discard. |
| Soft deletes | `is_active` on `stores` and `users`. No physical deletes. |
| Deactivated users | Cannot log in. Remain in all historical records. |
| Deactivated stores | Hidden from login dropdown. Historical sessions preserved. |
| Last admin | Cannot deactivate the last admin user. |
| Zoom default | Camera defaults to 2x per session. User preference resets on logout. |
| Basket lifetime | Cleared on: QR generation, "Clear All" / "Discard", logout, page refresh. |
| Print | Button present but non-functional in POC. Shows toast: "Printing is not available in this version." |
| Audit logging | All session `created`, `completed`, `cancelled` events logged to `audit_log`. |
| Store scoping | `store_manager` sees reports for their store only. `admin` sees all stores + store filter dropdown. |
| Admin store for sessions | Admins choose their active store at login. No store picker on the Scan screen. |

---

## 14. Error Handling

| Scenario | Behaviour |
|---|---|
| Camera access denied | Full-screen message with device-specific instructions to enable camera in Settings. |
| No camera detected | "No camera detected. This app requires a device with a rear camera." |
| Camera lost on resume | Auto-reinitialise. If fails: "Camera unavailable — tap to retry" overlay with retry button. |
| Zoom not supported | Hide zoom slider. Show info note: "Zoom not supported on this device — move closer to scan." |
| Invalid barcode | Toast: "Invalid barcode — please try again." Item not added to basket. |
| Debounce rejection | Silent — no visible error. |
| QR capacity exceeded | Error modal: "Basket too large for a single QR code. Please remove some items or split into two baskets." |
| Network failure on save | Toast: "Something went wrong saving your session. Please try again." + retry button. QR code still shown. |
| Incorrect PIN | Shake animation + "Incorrect PIN" error text + input cleared. |
| Unauthorised route | Redirect to `/scan` + toast: "You don't have permission to view that page." |
| Session expired / page refresh | Redirect to `/login`. Basket lost (acceptable for POC). |
| Supabase errors | Generic error toast. Full error logged to console. |
| Empty states | All lists and screens show `<EmptyState>` with lucide icon + message. |
| Loading states | Skeleton loaders matching content shape. No full-page spinners. |

---

## 15. Acceptance Criteria

### Login & Auth
- [ ] Login with store + user + 4-digit PIN
- [ ] Incorrect PIN rejected with shake animation and feedback
- [ ] Logout clears session and returns to login
- [ ] All routes except `/login` redirect to login if unauthenticated
- [ ] `/reports` accessible to `store_manager` and `admin` only
- [ ] `/admin` routes redirect to `/scan` for non-admin users

### Barcode Scanning
- [ ] Rear camera activates with 2x zoom as default
- [ ] Zoom adjustable via slider during scanning
- [ ] EAN-13 barcodes scanned and validated (13 digits + valid check digit)
- [ ] Invalid barcodes rejected with toast error
- [ ] Audible beep and/or haptic feedback on successful scan
- [ ] Scanned items appear in numbered list below viewfinder
- [ ] Individual items removable from list
- [ ] Clear basket with confirmation dialog
- [ ] 1.5-second debounce prevents rapid double-scan of same EAN
- [ ] Duplicate EANs allowed (different items with same barcode)

### QR Code Generation
- [ ] QR code generated in `LIST_EAN1_EAN2_...` format
- [ ] QR code displayed large and scannable on screen
- [ ] Session summary shown: session number, item count, timestamp
- [ ] Print button present but shows "not available" toast
- [ ] "New Basket" clears session and returns to scanning
- [ ] Session recorded in database on QR generation
- [ ] Warning if basket exceeds QR capacity (~280 items)
- [ ] Generate button disabled when basket is empty

### Management Reporting
- [ ] 3 stat cards: items scanned, QR codes generated, average basket size
- [ ] Date range filter functional
- [ ] Bar chart: QR codes per day
- [ ] Line chart: items scanned per day
- [ ] Recent sessions table with correct data
- [ ] Store-scoped for store managers, cross-store for admin
- [ ] New sessions appear in realtime without refresh

### Admin
- [ ] Create, edit, deactivate users with PIN pad for PIN entry
- [ ] Create, edit, deactivate stores
- [ ] All validation rules enforced
- [ ] Cannot deactivate last admin
- [ ] Inactive entities shown greyed out

### General
- [ ] Primark brand design system applied (colours, typography, spacing)
- [ ] Tailwind config with custom Primark theme tokens
- [ ] Mobile-first responsive design
- [ ] Bottom navigation with role-scoped tabs
- [ ] Empty states with icons on all lists/screens
- [ ] Skeleton loaders during data fetches
- [ ] Error toasts for network/scanning failures
- [ ] Seed data enables immediate testing (6 sessions, 5 users, 5 stores)
- [ ] Audit logging on all session events
- [ ] `updated_at` auto-set by Postgres trigger on `users` table

---

## 16. Build Order

Build in this sequence to avoid circular dependencies and ensure each layer builds on tested foundations:

```
Phase 1 — Foundation
  1.  Project scaffold (Vite + React + TS + Tailwind)
  2.  tailwind.config.js with Primark brand tokens
  3.  src/lib/types.ts
  4.  src/lib/supabase.ts
  5.  Supabase: run schema.sql → indexes.sql → seed.sql

Phase 2 — Core Utilities
  6.  src/lib/ean13.ts
  7.  src/lib/qrFormat.ts
  8.  src/lib/audio.ts
  9.  src/lib/utils.ts

Phase 3 — Context & Auth
  10. ToastContext + useToast
  11. AuthContext + useAuth (login/logout, permission flags)
  12. BasketContext + useBasket (add, remove, clear, debounce)

Phase 4 — Layout Shell
  13. NavBar
  14. BottomNav (role-scoped tabs)
  15. App.tsx routing skeleton with auth guards
  16. LoginScreen (store/user dropdowns + PinPad)

Phase 5 — Scanning
  17. useCamera (stream, zoom, torch, lifecycle, resume handling)
  18. useBarcodeScanner (EAN-13, beep, haptic, debounce)
  19. BarcodeScanner component (viewfinder, overlay, zoom slider)
  20. BasketList component (item list, empty state, generate button)
  21. ItemCountBadge
  22. ScanScreen (compose above + ConfirmDialog for clear)

Phase 6 — QR Generation & Session Save
  23. useQrGenerator (canvas render, data URL, capacity check)
  24. useScanSession (Supabase write: sessions + items + audit)
  25. QR Display Modal within ScanScreen
  26. Wire up session save on QR generation

Phase 7 — Reports
  27. useReportData (queries + realtime subscription)
  28. StatCard component
  29. DateRangePicker component
  30. DataTable component
  31. ReportsScreen (stat cards, charts, table, filters)

Phase 8 — Admin
  32. useStores, useUsers
  33. AdminScreen (Users tab + Stores tab + modals + validation)

Phase 9 — Polish
  34. EmptyState on all screens
  35. Skeleton loaders on all data-fetching screens
  36. Error handling: camera errors, network errors, invalid barcodes
  37. Realtime subscription test
  38. README.md (setup instructions, default logins, tech stack)
  39. .env.example
```

---

## Out of Scope (POC)

The following are explicitly excluded and should not be built:

- Mobile printer integration (Print button is placeholder only)
- EPOS system integration
- Product name/description lookup by EAN
- SSO / Azure AD / Entra ID
- Offline mode / service worker
- Supabase Row Level Security
- Supabase Auth (custom PIN auth used instead)
- Dark mode
- Multi-language support
- Push notifications
- Session persistence across page refresh
- Zebra TC53 device optimisation
