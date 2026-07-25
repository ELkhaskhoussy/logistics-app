# Sendlo — Bug Report

Findings from a browser test session (local + prod), 25 July 2026.
Ordered by severity. Nothing here is fixed yet — this is the working list.

---

## 🔴 BUG-01 — Silent failures: the app never tells the user an API call failed

**Severity:** High (worst offender in the list)
**Where:** Add-trip ("Publier le trajet"), transporter dashboard, and likely other screens

**Observed:** Clicking **"Publier le trajet"** does nothing at all — no toast, no error, no spinner change. The button appears simply not to work. The console shows the request failing, but the UI stays silent.
The dashboard behaves the same way: it displayed **"Aucun trajet à venir"** as if the account had no trips, while the console showed `Failed to load trips: AxiosError`. **An error was rendered as an empty state**, which is actively misleading.

**Expected:** Any failed call shows a clear message ("Échec de la création du trajet", "Impossible de charger vos trajets"), and load failures must be visually distinct from genuinely empty data.

**Notes:** Related to the pending task "add success/error toasts to key action buttons". The empty-vs-error confusion should be fixed at the same time.

---

## 🔴 BUG-02 — Local backend rejects all requests (CORS preflight 400)

**Severity:** High (blocks all local testing)
**Where:** Local dev environment only

**Observed:**
- Frontend is configured with `EXPO_PUBLIC_API_URL = http://192.168.1.16:8080`
- Every call fails; `OPTIONS http://192.168.1.16:8080/catalog/trips` → **400**
- A 400 (rather than a connection error) means *something* is listening but rejecting the preflight

**Impact:** No local end-to-end testing is possible — trip creation, booking, pre-accept and hand-over are all unreachable.

**To investigate:** whether the local gateway is running the current build, and whether its CORS config accepts origin `http://localhost:8081`. CORS is handled only at the gateway (per project convention — do **not** add per-service CORS, it caused duplicate headers and 403s before).

---

## 🟠 BUG-03 — No upper bound on trip capacity (absurd values reach production)

**Severity:** Medium
**Where:** Add-trip → capacity; visible on prod search

**Observed:** A production trip displays **"1e+31 kg libres"** — a capacity so large it renders in scientific notation.

**Expected:** A sane maximum (e.g. ≤ 1000 kg) enforced on input and on the backend, with the UI never showing scientific notation.

**Notes:** Input filters now block letters/symbols, but not magnitude.

---

## 🟠 BUG-04 — Non-route files live inside `app/`, so Expo Router treats them as routes

**Severity:** Medium (structural / noise)

**Observed:** Console warnings on every load:
```
Route "./networking/config.ts" is missing the required default export.
Route "./services/booking.ts" is missing the required default export.
Route "./utils/inputFilters.ts" is missing the required default export.
… (9 files total)
```
`app/networking/`, `app/services/` and `app/utils/` are inside the routing directory, so Expo Router tries to mount them as screens.

**Expected:** Move them outside `app/` (e.g. `src/networking`, `src/services`, `src/utils`) so only real screens live under `app/`.

**Risk if ignored:** noisy console, and a future file could accidentally become a navigable route.

---

## 🟡 BUG-05 — Layout declares routes that don't exist

**Severity:** Low
**Observed:**
```
[Layout children]: No route named "(auth)" exists in nested children
[Layout children]: No route named "(role-selection)" exists in nested children
```
The root `_layout.tsx` registers `(auth)` and `(role-selection)` as `Stack.Screen`s, but the router doesn't resolve them at that level.

**Expected:** Registered screens should match actual route groups. Harmless today, but it hides real routing mistakes in the noise.

---

## 🟡 BUG-06 — Date format inconsistent between input and recap

**Severity:** Low (cosmetic)
**Observed:** In add-trip, the picker field shows **`2026-07-30 00:00`** (ISO) while the recap below shows **`30 juil. 2026, 00:00`** (French) — two formats on the same screen.

**Expected:** One French-formatted display everywhere on web and native.

---

## 🟡 BUG-07 — Deprecated React Native Web style props

**Severity:** Low (future-proofing)
**Observed:** `"shadow*" style props are deprecated. Use "boxShadow"` and `props.pointerEvents is deprecated. Use style.pointerEvents`.

**Expected:** Migrate before the next RN Web major, which may drop them.

---

## Verified working (no action needed)

- **Input validation** — `Tunis123!@#` → `Tunis`; `abc25kg` → `25`; `4,5abc` → `4.5` (comma correctly converted to a decimal point). The original "text in the kilo/phone fields" complaint is resolved.
- **Add-trip wizard** — Meridian styling, progress bar, **both departure and arrival dates** present, live recap.
- **Prod landing + search** — loads correctly, trips and route chains render.
- **"Mes envois" tab** — deployed and present in the sender tab bar.

---

## Not yet testable

- **Notifications (US21)** — not implemented; no notification table, bell, push or notification emails exist yet.
- **US19 / US20 end-to-end** (pre-accept → hand-over → sender tracking) — blocked locally by BUG-02, and not yet deployed to prod.
