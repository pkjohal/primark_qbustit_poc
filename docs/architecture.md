# Architecture — Primark Qbust.it POC

## System Context

Qbust.it is a mobile-first web application deployed as a static SPA (Single-Page Application). Store colleagues access it via a browser on a shared handheld device. The app uses a device camera to scan EAN-13 barcodes, builds a basket in memory, and generates a QR code that the EPOS till scans at checkout.

```mermaid
graph TB
    Colleague["Store Colleague\n(mobile browser)"]
    App["Qbust.it SPA\n(React + Vite)"]
    Supabase["Supabase\n(Postgres + Realtime)"]
    EPOS["EPOS Till\n(Checkout system)"]
    Camera["Device Camera\n(MediaDevices API)"]

    Colleague -->|"uses"| App
    App -->|"reads/writes sessions,\nusers, stores"| Supabase
    App -->|"reads live feed"| Camera
    EPOS -->|"scans QR code\n(LIST_ format)"| App
    Supabase -->|"realtime session\ninsert events"| App
```

---

## Component Architecture

```mermaid
graph TD
    subgraph "Entry Point"
        main["main.tsx"]
        App["App.tsx\n(Router + Providers)"]
    end

    subgraph "Context (Global State)"
        AuthCtx["AuthContext\n(user, store, login, logout,\nrole helpers)"]
        BasketCtx["BasketContext\n(items[], addItem, removeItem,\nclearBasket, debounce)"]
        ToastCtx["ToastContext\n(showToast queue)"]
    end

    subgraph "Screens"
        Login["LoginScreen\n(store → user → PIN flow)"]
        Scan["ScanScreen\n(camera + basket + QR modal)"]
        Reports["ReportsScreen\n(stats, charts, sessions table)"]
        Admin["AdminScreen\n(users tab + stores tab)"]
    end

    subgraph "Scanning Components"
        BarcodeScanner["BarcodeScanner\n(camera viewfinder,\ntorch, zoom, overlay)"]
        BasketList["BasketList\n(scrollable EAN list,\nremove, generate)"]
        QrCodeDisplay["QrCodeDisplay\n(QR image + session info)"]
        ItemCountBadge["ItemCountBadge\n(floating item count)"]
    end

    subgraph "UI Components"
        StatCard["StatCard"]
        DataTable["DataTable"]
        DateRangePicker["DateRangePicker"]
        PinPad["PinPad"]
        ConfirmDialog["ConfirmDialog"]
        Toast["Toast"]
        ZoomSlider["ZoomSlider"]
    end

    subgraph "Layout Components"
        NavBar["NavBar\n(burger menu, user info, logout)"]
        PageHeader["PageHeader"]
    end

    subgraph "Hooks"
        useAuth["useAuth"]
        useBasket["useBasket"]
        useBarcodeScanner["useBarcodeScanner\n(html5-qrcode wrapper)"]
        useCamera["useCamera\n(zoom + torch via\nMediaStreamTrack)"]
        useQrGenerator["useQrGenerator\n(qrcode lib)"]
        useScanSession["useScanSession\n(Supabase writes)"]
        useReportData["useReportData\n(Supabase reads + Realtime)"]
        useUsers["useUsers\n(CRUD + active filter)"]
        useStores["useStores\n(CRUD + active filter)"]
        useAudit["useAudit\n(audit_log writes)"]
        useToast["useToast"]
    end

    subgraph "Lib"
        supabase["supabase.ts\n(Supabase client)"]
        types["types.ts\n(TypeScript interfaces)"]
        ean13["ean13.ts\n(validateEan13)"]
        qrFormat["qrFormat.ts\n(buildQrString, exceedsQrLimit)"]
        audio["audio.ts\n(Web Audio API beep)"]
        utils["utils.ts\n(formatDateTime, formatRelativeTime)"]
    end

    main --> App
    App --> AuthCtx
    App --> BasketCtx
    App --> ToastCtx
    App --> Login
    App --> Scan
    App --> Reports
    App --> Admin

    Scan --> BarcodeScanner
    Scan --> BasketList
    Scan --> ConfirmDialog

    BarcodeScanner --> useBarcodeScanner
    BarcodeScanner --> useCamera
    BarcodeScanner --> ZoomSlider
    BarcodeScanner --> ItemCountBadge

    useBarcodeScanner --> ean13
    useBarcodeScanner --> audio

    Scan --> useScanSession
    Scan --> useQrGenerator
    useQrGenerator --> qrFormat

    Reports --> useReportData
    Reports --> useUsers
    Reports --> useStores
    Reports --> StatCard
    Reports --> DataTable
    Reports --> DateRangePicker

    Admin --> useUsers
    Admin --> useStores
    Admin --> PinPad

    useScanSession --> supabase
    useScanSession --> useAudit
    useReportData --> supabase
    useUsers --> supabase
    useStores --> supabase
    useAudit --> supabase
    AuthCtx --> supabase
```

---

## Layers

| Layer | Contents | Responsibility |
|-------|----------|----------------|
| **Entry** | `main.tsx`, `App.tsx` | Bootstrap React, configure router and provider tree |
| **Screens** | `LoginScreen`, `ScanScreen`, `ReportsScreen`, `AdminScreen` | Full-page views; orchestrate hooks and components |
| **Context** | `AuthContext`, `BasketContext`, `ToastContext` | Global state shared across screens |
| **Components** | `components/scanning/*`, `components/ui/*`, `components/layout/*` | Reusable, stateless or lightly stateful UI |
| **Hooks** | `hooks/*` | Data fetching, Supabase mutations, device API interactions |
| **Lib** | `lib/*` | Pure utilities, types, and client singletons |
| **Database** | Supabase (Postgres) | Persistent storage; Realtime for live report updates |

---

## Routing

Routes are defined in `App.tsx` using React Router v6. Guards wrap protected routes.

| Path | Screen | Guard |
|------|--------|-------|
| `/login` | LoginScreen | None |
| `/scan` | ScanScreen | `RequireAuth` |
| `/reports` | ReportsScreen | `RequireAuth` + `RequireReports` (store_manager or admin) |
| `/admin` | AdminScreen | `RequireAuth` + `RequireAdmin` (admin only) |
| `*` | — | Redirects to `/login` |

---

## Authentication Flow

Authentication is entirely application-level (no Supabase Auth). On login the app queries the `users` table directly, comparing the submitted PIN string to the stored value. The authenticated user and store are held in `AuthContext` (React in-memory state). There is no token, session cookie, or local-storage persistence — a page refresh clears the session.

```mermaid
sequenceDiagram
    participant User
    participant LoginScreen
    participant AuthContext
    participant Supabase

    User->>LoginScreen: Selects store
    LoginScreen->>Supabase: SELECT * FROM stores WHERE is_active=true
    Supabase-->>LoginScreen: Store list

    User->>LoginScreen: Selects name
    LoginScreen->>Supabase: SELECT * FROM users WHERE store_id=? AND is_active=true
    Supabase-->>LoginScreen: User list

    User->>LoginScreen: Enters 4-digit PIN
    LoginScreen->>AuthContext: login(storeId, userId, pin)
    AuthContext->>Supabase: SELECT * FROM users WHERE id=? AND store_id=? AND is_active=true
    Supabase-->>AuthContext: User row
    AuthContext->>AuthContext: Compare pin string
    AuthContext->>Supabase: SELECT * FROM stores WHERE id=?
    Supabase-->>AuthContext: Store row
    AuthContext-->>LoginScreen: true (success)
    LoginScreen->>User: Navigate to /scan
```

---

## Scanning & QR Generation Flow

```mermaid
sequenceDiagram
    participant Colleague
    participant BarcodeScanner
    participant BasketContext
    participant ScanScreen
    participant useQrGenerator
    participant useScanSession
    participant Supabase

    Colleague->>BarcodeScanner: Points camera at barcode
    BarcodeScanner->>BarcodeScanner: html5-qrcode decodes EAN-13
    BarcodeScanner->>BarcodeScanner: validateEan13() check
    BarcodeScanner->>BarcodeScanner: playBeep() + vibrate()
    BarcodeScanner->>BasketContext: addItem(ean) [debounced 1500ms per EAN]
    BasketContext-->>ScanScreen: items[] updated

    Colleague->>ScanScreen: Taps "Generate QR"
    ScanScreen->>useQrGenerator: generate(items[])
    useQrGenerator->>useQrGenerator: buildQrString() → "LIST_EAN1_EAN2_..."
    useQrGenerator->>useQrGenerator: QRCode.toDataURL()
    useQrGenerator-->>ScanScreen: dataUrl + qrString

    ScanScreen->>useScanSession: saveSession(items, userId, storeId, qr, startedAt)
    useScanSession->>Supabase: RPC generate_session_number()
    Supabase-->>useScanSession: "QB-YYYYMMDD-XXXX"
    useScanSession->>Supabase: INSERT scan_sessions
    useScanSession->>Supabase: INSERT scan_items (bulk)
    useScanSession->>Supabase: INSERT audit_log
    useScanSession-->>ScanScreen: ScanSession record

    ScanScreen->>Colleague: Show QR modal (full-screen)
    Colleague->>Colleague: Show QR to checkout till
```

---

## Realtime Data Flow (Reports)

`useReportData` subscribes to Supabase Realtime on the `scan_sessions` table. Any INSERT of a `completed` session triggers a re-fetch, so the Reports dashboard updates automatically when a colleague generates a QR code elsewhere in the store.

```mermaid
sequenceDiagram
    participant Colleague A
    participant ScanApp
    participant Supabase
    participant Manager B
    participant ReportsScreen

    Colleague A->>ScanApp: Generates QR
    ScanApp->>Supabase: INSERT scan_sessions (status=completed)
    Supabase->>ReportsScreen: Realtime INSERT event (postgres_changes)
    ReportsScreen->>Supabase: Re-fetch sessions + stats
    Supabase-->>ReportsScreen: Updated data
    ReportsScreen->>Manager B: Dashboard updates live
```

---

## Camera & Device Integration

The `BarcodeScanner` component integrates with two browser APIs:

| API | Hook | Purpose |
|-----|------|---------|
| `html5-qrcode` (MediaDevices) | `useBarcodeScanner` | Access rear camera, decode EAN-13 at 10fps |
| `MediaStreamTrack.applyConstraints` | `useCamera` | Programmatic zoom (Android Chrome) and torch toggle |
| Web Audio API | `audio.ts` | Synthesised 1800Hz beep on successful scan |
| `navigator.vibrate` | `useBarcodeScanner` | 80ms haptic feedback on successful scan |

> Note: Camera zoom via `MediaStreamTrack` is not supported on iOS Safari. The `useCamera` hook detects this via `getCapabilities()` and conditionally renders the zoom slider.

---

## QR Code Format

The QR payload is a plain string conforming to a Qbust.it EPOS integration contract defined in `src/lib/qrFormat.ts`:

```
LIST_5012345678901_5012345678918_5012345678925
```

- Prefix `LIST_` identifies the payload type to the EPOS system
- EAN-13 codes are joined with `_` as the delimiter
- Maximum payload: 4,296 characters (QR Version 40, error correction level M)
- This corresponds to approximately 280 items per basket

---

## Technology Stack

| Concern | Technology | Version |
|---------|------------|---------|
| UI Framework | React | 18.3 |
| Language | TypeScript | 5.4 |
| Build Tool | Vite | 5.2 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | 6.22 |
| Barcode Scanning | html5-qrcode | 2.3 |
| QR Generation | qrcode | 1.5 |
| Backend / DB | Supabase (Postgres) | 2.39 |
| Charts | Recharts | 2.12 |
| Date Utilities | date-fns | 3.3 |
| Icons | lucide-react | 0.344 |
| UUID Generation | uuid | 9.0 |
