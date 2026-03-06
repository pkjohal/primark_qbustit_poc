# Qbust.it — Demo Script

## Elevator Pitch

Qbust.it is a mobile queue-busting tool for Primark store colleagues. During busy periods, a floor colleague walks the queue scanning customer items with their phone; when the basket is ready, the app generates a single QR code that the checkout till scans to process everything instantly — turning a ten-minute queue into a ten-second checkout.

---

## Demo Personas

| Persona | Name | Store | Role | PIN |
|---------|------|-------|------|-----|
| **Floor Colleague** | Sarah K | Manchester Arndale | floor_colleague | `1234` |
| **Store Manager** | Tom B | Manchester Arndale | store_manager | `5678` |
| **Administrator** | Dan M | London Oxford Street | admin | `4567` |

---

## Pre-Demo Setup Checklist

- [ ] Open the app in Chrome DevTools with **iPhone 14 Pro** or **Pixel 7** simulation enabled (375×812 or 393×851)
- [ ] Confirm the seed data is loaded — Reports should show sessions from the past 3 days for Manchester Arndale
- [ ] Have 3–4 physical products with visible EAN-13 barcodes ready, OR use the test barcode sheet at `test-barcodes.html` (open it in a second browser window/tab as a prop)
- [ ] Ensure the device (or simulated device) has camera permission granted, or use a real Android handset for the live scan demo
- [ ] Start on the login screen (`/login`) — not already logged in

---

## Scene List

| # | Scene | Persona | Time |
|---|-------|---------|------|
| 1 | The Problem | — | 1 min |
| 2 | Login Flow | Sarah K (colleague) | 1 min |
| 3 | Live Barcode Scanning | Sarah K | 3 min |
| 4 | Basket Management | Sarah K | 1 min |
| 5 | QR Code Generation | Sarah K | 2 min |
| 6 | Reports Dashboard | Tom B (manager) | 2 min |
| 7 | Admin — User Management | Dan M (admin) | 2 min |
| 8 | Wrap-Up & Questions | — | 1 min |

**Total estimated time: ~13 minutes**

---

## Scene 1 — The Problem

**Screen**: Any — this is verbal setup before touching the app.

### Talking Points

> "Picture it: it's a Saturday afternoon in Manchester Arndale. There are 40 people in the queue, two tills open, and each transaction takes 3–4 minutes. Customers are abandoning their baskets and walking out. The store loses the sale, the colleague is stressed, and the manager has no levers to pull.

> Qbust.it gives Primark a fourth option. Instead of opening more tills or asking customers to wait, a colleague walks the queue with their phone, scans the customer's items on the spot, and by the time they reach the till their basket is already processed. The till colleague sees one QR code — one scan — and the sale is done.

> Let me show you how it works in practice."

---

## Scene 2 — Login Flow

**Screen**: `/login`
**Persona**: Sarah K — Floor Colleague, Manchester Arndale

### Actions

1. Show the login screen — Primark branding, gradient background.
2. Open the **Store** dropdown — select **Manchester Arndale**.
3. Open the **Name** dropdown — select **Sarah K**.
4. Enter PIN: **1 → 2 → 3 → 4** (the fourth digit auto-submits).
5. App navigates to `/scan`.

### Talking Points

> "The login is designed for shared devices and a noisy environment. No email address, no password manager. Colleagues tap their store, their name, and their four-digit PIN. That's it — it unlocks in under three seconds."

> "The PIN pad auto-submits on the fourth digit, so there's no confirm button to miss."

> "If the PIN is wrong, the dots shake and clear — they try again. No lockouts at this stage."

### What to Highlight
- The 3-step progressive disclosure: store → name → PIN
- The PIN dot indicators filling as digits are entered
- The instant auto-submit on the 4th digit

---

## Scene 3 — Live Barcode Scanning

**Screen**: `/scan` — camera viewfinder (top 60% of screen)
**Persona**: Sarah K

### Actions

1. Show the live camera viewfinder filling the top of the screen.
2. Point at the first barcode — the targeting frame (white border with animated blue scan line) is visible.
3. Scan the item — a **beep sounds** and the device **vibrates**.
4. Show the item appearing immediately in the basket list below.
5. Scan 2–3 more items the same way.
6. Point out the **item count badge** in the top-right corner of the camera (updates with each scan).

### Talking Points

> "As soon as the camera sees a barcode inside that frame, it fires — the colleague doesn't press anything. They hear a beep and feel a vibration, the same feedback as a supermarket scanner. They never need to look at the screen to know a scan landed."

> "Down here in the basket panel they can see everything that's been scanned in sequence. If something's wrong they can swipe to remove it individually — we'll show that in a moment."

> "In the top right of the viewfinder you can see the live item count. The colleague can keep scanning without ever navigating away from the camera."

### What to Highlight
- Zero-button scanning — purely camera-triggered
- The animated scan line in the targeting overlay
- Beep + vibration feedback (mention iOS Safari limitation if on iOS)
- Live item count badge

### Camera Controls (Optional — show if audience is technical)

> "There are two hardware controls up here. The torch button — useful for poorly lit stockroom or fitting room areas. And down here, a zoom slider for colleagues who need a bit more reach on items at the bottom of a trolley."

> "Both of these use the phone's native camera API. On Android Chrome they work fully. On iOS Safari the zoom isn't available — we surface a helpful message and ask them to move closer."

---

## Scene 4 — Basket Management

**Screen**: `/scan` — basket panel (bottom 40%)
**Persona**: Sarah K

### Actions

1. Scroll the basket list to show scanned items with their EAN codes and sequence numbers.
2. Tap the **remove (×) icon** on one item — it disappears and sequence numbers reflow.
3. Scan the same item again — it re-appears at the bottom.
4. Tap **Clear** — the confirmation dialog appears.
5. Tap **Cancel** on the dialog (do NOT clear — you need items for Scene 5).

### Talking Points

> "Mistakes happen. A colleague scans an item that turns out to be the display model, or the customer changes their mind. They tap the × next to that item and it's gone. The sequence renumbers automatically — no gap in the list."

> "The Clear button asks for confirmation before wiping everything. That prevents an accidental tap from losing a basket of 15 items just before checkout."

---

## Scene 5 — QR Code Generation

**Screen**: `/scan` → full-screen QR modal
**Persona**: Sarah K

### Actions

1. With 3–5 items in the basket, tap the **Generate QR** button (bottom of basket panel).
2. A brief loading spinner appears ("Generating QR code…").
3. The full-screen QR modal slides up — green tick, "QR Code Ready" heading.
4. Show the QR code image.
5. Show the session summary (session number `QB-YYYYMMDD-XXXX`, item count, time).
6. Tap **Print** — an informational toast appears ("Printing is not available in this version.").
7. Tap **New Basket** — modal closes, basket resets, session timer resets.

### Talking Points

> "Once the basket is ready, one tap on Generate QR. The app builds the QR code entirely on the device — no server round-trip — so it's instant even on a patchy store Wi-Fi connection."

> "This QR code encodes every EAN in a single string. The till colleague at checkout scans it once and the EPOS system expands it into all the individual items. The customer experience is identical to a normal checkout, just without the wait."

> "The session gets a reference number — QB, today's date, a sequence — so if there's ever a dispute or a refund query, it's traceable back to this exact interaction."

> "Print is a placeholder at this stage — the actual mobile printer integration is Phase 2. For the POC we're validating the scanning and QR flows."

> "New Basket resets everything and the colleague is ready for the next customer."

### What to Highlight
- Full-screen QR display — easy for the checkout colleague to scan
- Session reference number for traceability
- The "New Basket" instant reset

---

## Scene 6 — Reports Dashboard

**Screen**: `/reports`
**Persona**: Tom B — Store Manager, Manchester Arndale (log out Sarah K first; log in as Tom B with PIN `5678`)

### Actions

1. Log out (NavBar burger menu → Log Out).
2. Log in as **Tom B** at Manchester Arndale, PIN **5678**.
3. Navigate to **Reports** via the burger menu.
4. Show the three **stat cards**: Total Items Scanned, QR Codes Generated, Avg Items per QR.
5. Show the **bar chart** (QR codes per day).
6. Show the **line chart** (items per day).
7. Show the **Recent Sessions table**: session number, colleague, item count, relative time.
8. Change the **date range** in the picker to narrow the window.

### Talking Points

> "The Store Manager view is the operations picture. Tom can see at a glance how many baskets have been processed today, how many items that represents, and the average basket size — which tells him whether colleagues are using the tool for full trolleys or just small top-ups."

> "The charts show the daily pattern over the last seven days by default. He can narrow or widen that window with the date picker to pull a specific trading period."

> "Down in the Recent Sessions table, every transaction is listed by colleague. If a session looks unusual — say, one item — that's a signal worth investigating."

> "This data updates in real time. The moment a colleague on the shop floor generates a QR code, it appears here. Tom doesn't need to refresh."

### What to Highlight
- Live realtime update (mention the Supabase Realtime subscription)
- Store-scoped view — Tom sees Manchester Arndale only, not all stores
- The relative timestamps ("2 minutes ago", "3 days ago")

---

## Scene 7 — Admin: User Management

**Screen**: `/admin` → Users tab
**Persona**: Dan M — Administrator, London Oxford Street (log out Tom B; log in as Dan M with PIN `4567`)

### Actions

1. Log out, log in as **Dan M** at London Oxford Street, PIN **4567**.
2. Navigate to **Admin** via the burger menu.
3. Show the **Users tab** — list of all users across all stores.
4. Tap **Add User** — the modal slides up.
5. Fill in a test user: name "Test Colleague", email `test.colleague@primark.com`, select any store, role "Floor Colleague".
6. Tap **Tap to set PIN** — the PIN pad appears inline.
7. Enter a PIN: `9999`.
8. Tap **Save**.
9. Show the new user appearing in the list.
10. Tap **Edit** on the new user — show the pre-filled form.
11. Tap **Deactivate** (UserX icon) — user is greyed out in the list.
12. Briefly show the **Stores tab** — same pattern (list, add, edit, activate/deactivate).

### Talking Points

> "The Admin view is for IT and operations. Dan manages users across every Primark store from a single screen."

> "Creating a user is straightforward — name, email, store assignment, role, and PIN. The PIN pad here is the same component the colleague uses at login, which keeps the experience consistent and removes the temptation to set a non-numeric PIN."

> "Deactivating a user removes their access immediately — they can't log in — but all their historical session data is preserved. Nothing is deleted."

> "There's one guardrail built in: you cannot deactivate the last active admin account. The system blocks it with a message. You can't accidentally lock yourself out."

### What to Highlight
- Cross-store visibility (Dan sees all stores; Tom can only see his own)
- Soft-delete pattern: deactivate ≠ delete
- The last-admin guard

---

## Scene 8 — Wrap-Up

**Screen**: Any

### Talking Points

> "So what we've seen in the last 13 minutes is the full end-to-end POC: a colleague logs in in 3 seconds, scans a basket in under a minute, generates a QR code that the till processes in one scan, and the manager sees that transaction appear on their dashboard in real time."

> "The things we haven't shown today are intentional Phase 2 and 3 items: the mobile printer integration, moving from PINs to SSO via Azure Active Directory, and adding Supabase Row Level Security once there's a proper auth layer. Those are the engineering gates before production."

> "Questions?"

---

## Demo Tips

- **If a barcode won't scan**: Use the `test-barcodes.html` file as a fallback — open it on screen and scan the printed codes from it. All EANs on that page are valid EAN-13 codes.
- **If the camera permission is blocked**: Show the error state intentionally — it demonstrates the graceful error handling. Say: "The app handles this — it tells the colleague exactly what setting to change."
- **If asked about offline mode**: Acknowledge it's a known POC gap. "Scanning works offline but session save requires connectivity — that's a Phase 2 requirement we've logged."
- **If asked about prices / product names**: "EANs are relayed as-is to the EPOS. The till already knows the price — it's the same system, just skipping the individual scan step. A product name display in the app is on the backlog but not in scope for POC."
- **If asked about security**: "PINs are plaintext for POC speed — we've documented this explicitly. The production path is SSO via Azure AD. No Row Level Security yet either — that's gated on the auth upgrade."
