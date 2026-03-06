# Qbust.it — Presenter Notes

Companion to `DEMO_SCRIPT.md`. These are the cue-card style reminders for use during a live presentation. Read these in the 10 minutes before you go on.

---

## Before You Walk In

| Check | Done? |
|-------|-------|
| Chrome DevTools open, mobile simulation active (iPhone 14 Pro or Pixel 7) | |
| App running at `http://localhost:5173` (or deployed URL) | |
| Logged out — login screen showing | |
| `test-barcodes.html` open in a spare tab (fallback if no physical barcodes) | |
| Volume turned up — the beep is part of the demo | |
| PIN cheat-sheet memorised: Sarah=1234, Tom=5678, Dan=4567 | |

---

## Login Credentials (Quick Reference)

```
Sarah K  |  Manchester Arndale  |  floor_colleague  |  PIN: 1234
Tom B    |  Manchester Arndale  |  store_manager    |  PIN: 5678
Dan M    |  London Oxford St    |  admin            |  PIN: 4567
```

---

## Timing Cues

| Time | Where you should be |
|------|---------------------|
| 0:00 | Scene 1 — verbal setup (no app yet) |
| 1:00 | Scene 2 — login as Sarah K |
| 2:00 | Scene 3 — scanning |
| 5:00 | Scene 4 — basket management |
| 6:00 | Scene 5 — generate QR |
| 8:00 | Scene 6 — log in as Tom B, reports |
| 10:00 | Scene 7 — log in as Dan M, admin |
| 12:00 | Scene 8 — wrap-up |
| 13:00 | Questions |

If you're running over: **skip Scene 4** (basket management) and move straight from scanning to QR generation. The remove-item flow is impressive but not essential.

---

## Scene-by-Scene Cue Cards

---

### Scene 1 — The Problem (verbal, ~1 min)

**Say**: Saturday afternoon, Manchester Arndale, 40-person queue, two tills, 3-4 minutes per transaction.

**The hook**: "Qbust.it gives Primark a fourth option."

**Don't linger** — get to the app quickly. The problem statement should take 45 seconds max.

---

### Scene 2 — Login (~1 min)

**Login sequence**: Store dropdown → Manchester Arndale → Name dropdown → Sarah K → PIN 1 2 3 4

**Key moment**: 4th digit auto-submits. Say: "No confirm button — it unlocks on the fourth digit."

**Watch out for**: If the stores dropdown takes a second to load, fill the silence with "It's pulling active stores from the database."

---

### Scene 3 — Scanning (~3 min)

**This is the centrepiece.** Spend time here.

**What to say when you point the camera**:
- "Camera fires automatically — no button."
- "Hear the beep? Feel the vibration? That's the confirmation."
- "Item count badge top-right — updates live."

**Show the torch button** even if you don't need it. Say "For low-light areas."

**Zoom slider** — drag it once and say "Colleague is 2 feet away from the bottom of a trolley — this handles it."

**If scanning is slow**: Move the barcode closer. The scanning box is the white rectangle — keep the barcode inside it. If still no luck, switch to `test-barcodes.html`.

---

### Scene 4 — Basket Management (~1 min)

**Remove an item**: Tap × on one row. "Gone. Sequence numbers renumber automatically."

**Show Clear confirm dialog**: Tap Clear, show the dialog, then tap **Cancel**. Do NOT clear the basket — you need items for Scene 5.

**Key message**: "No accidents. No one-tap disasters."

---

### Scene 5 — QR Generation (~2 min)

**Tap Generate QR.** Loading spinner is brief — don't fill the silence.

**Full-screen QR modal — pause here.**

> "This is the moment. The colleague turns the phone to face the customer. One code. Everything in it."

**Point to the session number** (QB-...). Say: "Traceable. Refundable. Auditable."

**Print button**: Tap it, toast appears. Say: "Phase 2. Mobile printer integration. Placeholder for now — the flow is validated."

**New Basket**: Tap it. "Ready for the next customer."

---

### Scene 6 — Reports (~2 min)

**Log out first**: Burger menu (top right) → Log Out.

**Log in as Tom B**, Manchester Arndale, PIN **5678**.

**Navigate to Reports**: Burger menu → Reports.

**Walk through in this order**:
1. Stat cards — "3 numbers, instant health check."
2. Bar chart — "Which days were busiest."
3. Line chart — "How many items per day, not just sessions."
4. Session table — "Who did what and when."

**Key message**: "Updates in real time. Tom doesn't need to refresh."

**If asked how the live update works**: "Supabase Realtime — Postgres change events pushed over a WebSocket. The moment a colleague generates a QR code anywhere in the store, it appears here."

---

### Scene 7 — Admin (~2 min)

**Log out Tom**, log in as **Dan M**, London Oxford Street, PIN **4567**.

**Navigate to Admin**: Burger menu → Admin.

**Users tab**:
1. Tap Add User. Show the form.
2. Fill in name and email quickly — audience doesn't need to watch you type.
3. **Tap to set PIN** is the money moment — show the PIN pad appearing inline.
4. Save. User appears in the list.
5. Tap deactivate (X icon). User goes grey.

**Key message**: "Soft-delete. Access removed. History preserved."

**Last-admin guard** — mention it but don't demo it (risky to accidentally trigger). Say: "If Dan tried to deactivate himself as the last admin, the system blocks it."

**Stores tab**: Briefly flip to it. "Same pattern. Create, edit, activate, deactivate."

---

### Scene 8 — Wrap-Up (~1 min)

**Summarise the three roles in one breath**:
> "Colleague scans. Manager monitors. Admin manages."

**Name the Phase 2/3 gates**:
- Mobile printer (Phase 2)
- SSO / Azure AD (Phase 3)
- Row Level Security (pre-production gate)

**Open the floor**: "Questions?"

---

## Handling Hard Questions

| Question | Response |
|----------|----------|
| "Are PINs secure?" | "Plaintext for POC speed — documented explicitly. Production path is SSO via Azure AD. We've built the auth layer so it can be swapped out cleanly." |
| "What happens if the network drops?" | "Scanning works offline — it's all on-device. Saving the session needs a connection. Offline session queuing is a Phase 2 requirement we've scoped." |
| "Why can't I see product names?" | "The EPOS already has the price and product data. We relay the EAN as-is — same as a standard checkout scan, just batched. Adding a product lookup is a future backlog item." |
| "What if the QR code is too big?" | "We cap at 4,296 characters — roughly 280 items. The app warns the colleague and asks them to split into two baskets before it happens." |
| "Does it work on iPhone?" | "Yes — login, scanning, QR generation all work on iOS Safari. Camera zoom isn't available on iOS (browser limitation), but everything else does." |
| "How does the till know what to do with the QR?" | "The QR string starts with `LIST_` — the EPOS integration reads that prefix, splits on underscores, and processes each EAN-13 as a standard item. That integration point is part of the Phase 2 EPOS work." |
| "Is there an audit trail?" | "Yes. Every completed and cancelled session is logged, including which colleague, which store, when, and how many items. There's an `audit_log` table capturing every significant event." |

---

## Recovery Moves

**Camera won't start / permission denied**
> Say: "Let me show you the error state — it's worth seeing." Show the "Camera Access Required" screen. Read the instructions on screen. "It tells the colleague exactly which setting to change. Once they allow it, it resumes." Then continue the demo in DevTools device simulation or switch to a physical device.

**Barcode won't decode**
> Open `test-barcodes.html` in a second tab, display it full-screen, scan the barcodes from the screen. Works consistently.

**Supabase is down / data not loading**
> Acknowledge calmly: "The backend is Supabase — it's live cloud infrastructure. Let me continue with what I can show locally." Demo the login, scanning, and QR generation (all client-side). Mention: "Reports and admin are database-driven — in a production demo environment we'd have a dedicated Supabase instance reserved for this."

**Logged in as wrong user**
> Burger menu → Log Out. Start the login flow again. Don't apologise — just say "Let me switch to the manager view."

---

## What NOT to Say

- Don't say "this is just a prototype" repeatedly — it undercuts the work. Say "POC" once, then present it confidently.
- Don't show the code or mention specific files during the demo unless asked.
- Don't promise features not in the codebase (e.g. "you can filter by colleague" — the colleague filter UI exists but the `useUsers` fetch isn't wired to the report query).
- Don't apologise for the placeholder Print button — the talking point handles it positively.
