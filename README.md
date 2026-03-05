# Primark Qbust.it —POC Queue Busting 

Qbust.it is an internal mobile application for Primark store colleagues to scan customer items on the shop floor using EAN-13 barcodes. It generates a single QR code representing the entire basket; at the checkout, the till colleague scans the QR code to process all items instantly, eliminating queue wait times during peak periods.

This is the POC build, focused on core barcode scanning, QR code generation, PIN-based authentication, camera zoom controls, a placeholder print function, and management reporting.

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd primark-qbustit-poc
npm install
```

### 2. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com), then run the SQL files against your project **in this exact order** (via the Supabase SQL editor):

```
supabase/schema.sql    ← Tables, functions, triggers
supabase/indexes.sql   ← Performance indexes
supabase/seed.sql      ← Stores, users, sample sessions
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase project credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are available in your Supabase project under **Settings → API**.

### 4. Enable Realtime

In the Supabase dashboard, go to **Database → Replication** and enable Realtime on the `scan_sessions` table.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) on a mobile device or in Chrome DevTools mobile simulation.

---

## Default Logins

| Name    | Store               | Role             | PIN  |
|---------|---------------------|------------------|------|
| Sarah K | Manchester Arndale  | Floor Colleague  | 1234 |
| Tom B   | Manchester Arndale  | Store Manager    | 5678 |
| Amy L   | Birmingham Primark  | Floor Colleague  | 1234 |
| James R | Birmingham Primark  | Store Manager    | 5678 |
| Dan M   | London Oxford Street | Admin           | 4567 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS with Primark brand tokens |
| Barcode Scanning | html5-qrcode (EAN-13 via MediaDevices API) |
| QR Code Generation | qrcode (client-side, `LIST_` format) |
| Backend / Database | Supabase (Postgres + Realtime) |
| Charts | Recharts |
| Date Utilities | date-fns |
| Routing | React Router v6 |
| Icons | lucide-react |

---

## Folder Structure

```
src/
  components/
    layout/    NavBar, BottomNav, PageHeader
    ui/        StatCard, PinPad, ConfirmDialog, EmptyState, Toast,
               DateRangePicker, DataTable, ZoomSlider
    scanning/  BarcodeScanner, BasketList, ItemCountBadge, QrCodeDisplay
  context/     AuthContext, BasketContext, ToastContext
  hooks/       useAuth, useBasket, useScanSession, useCamera,
               useBarcodeScanner, useQrGenerator, useReportData,
               useStores, useUsers, useAudit, useToast
  lib/         types.ts, supabase.ts, ean13.ts, qrFormat.ts, audio.ts, utils.ts
  screens/     LoginScreen, ScanScreen, ReportsScreen, AdminScreen
supabase/
  schema.sql, indexes.sql, seed.sql
```

---

## QR Code Format

The QR code encodes a single string. The `LIST_` prefix identifies it to the EPOS system as a Qbust.it basket:

```
LIST_5012345678901_5012345678918_5012345678925
```

The EPOS system splits on underscores, discards the `LIST` prefix, and processes each EAN-13 as an individual item.

---

## POC Scope & Known Limitations

- **Printing**: Print button is present but shows "not available" — mobile printer integration is Phase 2.
- **PINs stored in plaintext**: Acceptable for internal POC on shared devices. Phase 3 migrates to SSO (Azure AD / Entra ID).
- **No Row Level Security**: Application-level role checks only. RLS to be added before production.
- **No offline support**: Requires network connectivity for session save and login.
- **Session not persisted across refresh**: Page refresh clears the basket and requires re-login.
- **No product lookup**: EAN codes are scanned and relayed to EPOS as-is; product names are not displayed.
- **Zoom support**: Camera zoom is device/browser dependent. iOS Safari does not support programmatic zoom.
