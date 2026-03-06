# Business Requirements — Primark Qbust.it POC

## System Overview

**Qbust.it** is an internal queue-busting mobile application for Primark store colleagues. During peak trading periods, floor colleagues use the app to scan customer items (EAN-13 barcodes) using a smartphone or handheld device while customers wait on the shop floor. The app generates a single QR code representing the entire basket. When the customer reaches a checkout, the till colleague scans the QR code to process all items instantly, eliminating the need for individual item scanning at the point of sale.

This document covers the POC (proof of concept) build. It validates core scanning, QR generation, and reporting capabilities before production investment.

---

## Business Context

| Item | Detail |
|------|--------|
| **Organisation** | Primark |
| **System Name** | Qbust.it |
| **Build Stage** | Proof of Concept |
| **Target Users** | Floor Colleagues, Store Managers, Administrators |
| **Deployment Target** | Mobile browser (iOS Safari, Android Chrome) on shared handheld devices |
| **Integration Target** | Existing Primark EPOS (Electronic Point of Sale) tills |

---

## User Personas

### Floor Colleague
A store staff member who roams the shop floor assisting customers. Uses the app to scan items into a basket and present the generated QR code to customers for use at checkout. Has no access to reporting or administration.

### Store Manager
A store management colleague who needs visibility of scanning activity at their store. Can view reporting dashboards for their store only.

### Administrator (Head Office / IT)
A privileged user, typically from IT or operations, who manages the user directory and store configuration across all locations. Can view reports across all stores.

---

## User Stories

### Authentication

- As a **colleague**, I want to select my store and name from a list, then enter my 4-digit PIN, so that I can log in quickly without typing credentials on a small screen.
- As a **colleague**, I want the app to reject an incorrect PIN with clear feedback, so that I know to re-enter it.
- As a **colleague**, I want to be able to step back through the login flow (PIN → name, name → store) without starting over.

### Barcode Scanning

- As a **floor colleague**, I want the device camera to automatically scan EAN-13 barcodes as I point it at items, so that I can capture items quickly without pressing a button.
- As a **floor colleague**, I want to hear a beep and feel a vibration when a scan is accepted, so that I get instant confirmation without looking at the screen.
- As a **floor colleague**, I want duplicate scans of the same item to be suppressed within 1.5 seconds, so that rapid re-scans of the same barcode do not double-count items.
- As a **floor colleague**, I want to be shown the current item count while scanning, so that I know how many items are in the basket.
- As a **floor colleague**, I want to see a visual guide overlay (targeting frame) on the camera view, so that I know where to position barcodes.
- As a **floor colleague**, I want to toggle the device torch on and off, so that I can scan in low-light conditions.
- As a **floor colleague**, I want to adjust the camera zoom level, so that I can scan items from a comfortable distance.
- As a **floor colleague**, I want to remove a specific item from the basket list, so that I can correct scanning mistakes.
- As a **floor colleague**, I want to clear the entire basket after confirmation, so that I can start a new customer without accidental data loss.

### QR Code Generation

- As a **floor colleague**, I want to generate a single QR code representing all scanned items, so that the checkout colleague can process the basket in one scan.
- As a **floor colleague**, I want the QR code to be shown full-screen with the session reference and item count, so that I can clearly present it to the checkout colleague.
- As a **floor colleague**, I want the session to be saved automatically when the QR code is generated, so that no manual confirmation step is required.
- As a **floor colleague**, I want to start a new basket immediately after a QR code is generated, so that I can process the next customer without delay.

### Reporting

- As a **store manager**, I want to see the total number of items scanned and QR codes generated for my store, so that I can understand queue-busting activity levels.
- As a **store manager**, I want to see daily charts of QR codes generated and items scanned, so that I can identify peak periods.
- As a **store manager**, I want to filter reports by date range, so that I can focus on specific trading periods.
- As a **store manager**, I want to see a list of recent sessions with the colleague name, item count, and time, so that I can trace individual interactions.
- As an **administrator**, I want to view reports across all stores, so that I can monitor network-wide adoption and performance.
- As an **administrator**, I want to filter reports by individual store, so that I can drill into specific locations.

### Administration

- As an **administrator**, I want to create new user accounts with a name, email, store assignment, role, and PIN, so that new colleagues can access the app.
- As an **administrator**, I want to edit existing user details and reset PINs, so that I can maintain accurate records and support access issues.
- As an **administrator**, I want to deactivate a user account without deleting it, so that leavers lose access while their historical data is preserved.
- As an **administrator**, I want the system to prevent deactivating the last active admin account, so that I cannot lock myself out.
- As an **administrator**, I want to create and manage stores (name, code, region), so that new locations can be onboarded.
- As an **administrator**, I want to deactivate a store without deleting it, so that closed locations are removed from login without losing historical data.

---

## Functional Requirements

### FR-1: Authentication
- FR-1.1: The login flow presents active stores in alphabetical order via dropdown selection.
- FR-1.2: On store selection, the system loads active users for that store in alphabetical order.
- FR-1.3: After user selection, the system presents a numeric PIN pad (0–9).
- FR-1.4: The PIN is validated by comparing the entered 4-digit string against the stored value. Incorrect PINs trigger a shake animation and clear the input.
- FR-1.5: Successful login navigates the user to the Scan screen.
- FR-1.6: Session state is held in memory; a page refresh requires re-login.

### FR-2: Barcode Scanning
- FR-2.1: The scanner targets EAN-13 barcodes exclusively, using the rear-facing camera.
- FR-2.2: Decoded codes pass EAN-13 check-digit validation before acceptance.
- FR-2.3: Duplicate scans of the same EAN within a 1,500ms window are silently rejected.
- FR-2.4: Accepted scans trigger a synthesised 1800Hz audio beep and 80ms device vibration.
- FR-2.5: Camera zoom is adjustable via slider (where the device supports `MediaStreamTrack` zoom constraints).
- FR-2.6: The device torch can be toggled on/off (where supported).
- FR-2.7: Camera errors (permission denied, no camera, unavailable) display actionable error states.

### FR-3: Basket Management
- FR-3.1: Basket state is held in client memory (`BasketContext`) and is not persisted until QR generation.
- FR-3.2: Items can be removed individually from the basket list; sequence numbers reflow after removal.
- FR-3.3: The basket can be cleared (all items) via a confirmation dialog.
- FR-3.4: Baskets exceeding the QR character limit (~280 items) cannot be converted to a QR code; the user is prompted to split the basket.

### FR-4: QR Code Generation
- FR-4.1: The QR payload follows the format `LIST_EAN1_EAN2_..._EANn`.
- FR-4.2: QR codes are generated client-side at 280×280px with error correction level M.
- FR-4.3: On generation, the app calls `generate_session_number()` via Supabase RPC, inserts the session, inserts individual scan items, and writes an audit log entry — atomically from the user's perspective.
- FR-4.4: The QR modal shows the session reference number, item count, and completion time.
- FR-4.5: The Print button is present but non-functional (shows an informational toast).

### FR-5: Reporting
- FR-5.1: Reports display completed sessions only (`status = 'completed'`).
- FR-5.2: Default date range is the past 7 days.
- FR-5.3: Store managers see data for their assigned store only. Administrators see data for all stores.
- FR-5.4: Summary statistics display total items scanned, total QR codes generated, and average items per QR code.
- FR-5.5: Bar chart shows QR codes generated per calendar day.
- FR-5.6: Line chart shows items scanned per calendar day.
- FR-5.7: The session table shows the 20 most recent sessions, sorted by start time descending.
- FR-5.8: The Reports screen subscribes to Supabase Realtime and refreshes automatically when new completed sessions are inserted.

### FR-6: Administration
- FR-6.1: The Admin screen is accessible to the `admin` role only.
- FR-6.2: Users can be created, edited, activated, and deactivated.
- FR-6.3: PIN entry in the admin user form uses the same numeric PIN pad component as the login screen.
- FR-6.4: On edit, the PIN field is optional — leaving it blank retains the existing PIN.
- FR-6.5: The system prevents deactivating the last active admin user.
- FR-6.6: Stores can be created, edited, activated, and deactivated.
- FR-6.7: Store codes are auto-uppercased on input.

---

## Non-Functional Requirements

### NFR-1: Device Compatibility
- The application targets modern mobile browsers (iOS Safari 16+, Android Chrome 120+).
- The UI is designed mobile-first (max-width ~390px) and uses a full-height layout suited to handheld devices.

### NFR-2: Performance
- Barcode scanning runs at 10fps; the scanning box is 80% of viewfinder width and 25% of height.
- QR generation is client-side and completes in under 200ms on a mid-range device.

### NFR-3: Reliability
- Scan deduplication (1,500ms debounce per EAN) prevents accidental double-counting.
- Audio errors are swallowed silently to ensure scanning continues without sound if the audio API fails.
- Camera retry is available without requiring a page reload.

### NFR-4: Security (POC Limitations — see below)
- Authentication is application-level only.
- Role-based access controls (RBAC) are enforced in the React router layer.

### NFR-5: Auditability
- Every completed and cancelled session is recorded in `scan_sessions`.
- Significant events (session completed, session cancelled) are written to `audit_log` with actor, entity, and timestamp.

---

## Known Limitations & Out of Scope (POC)

| Area | POC Status | Phase |
|------|------------|-------|
| Printing | Print button shows "not available" toast | Phase 2 |
| PIN hashing | PINs stored in plaintext | Phase 3 (SSO migration) |
| SSO / Azure AD | Not implemented | Phase 3 |
| Row Level Security (Supabase RLS) | Not enabled — app-level checks only | Pre-production |
| Offline support | Requires network for login and session save | Future |
| Session persistence across refresh | Page refresh requires re-login | Future |
| Product name lookup | EANs relayed as-is; no product catalogue | Future |
| iOS Safari zoom | Programmatic zoom not supported | Device limitation |
