# Sendlo — Bug Report

Full-stack pass over the **live production** system (sendlo.fr), 9 August 2026.
Covers frontend, backend, design consistency and core business rules.

Every item marked **Confirmed** was verified against production — running code,
production database rows or the rendered site. Items marked **Suspected** were
found by reading code and have not been reproduced end to end.

This file replaces the 25 July report. Status of the old findings is in
[Previously reported](#previously-reported) at the bottom.

---

## Summary

| ID | Severity | Area | One line | Status |
|---|---|---|---|---|
| BUG-10 | 🔴 Critical | Core flow | No transporter has a phone → WhatsApp contact is dead platform-wide | ✅ Code fixed · ⚠️ data outstanding |
| BUG-11 | 🔴 High | Data | Phone numbers stored in incompatible formats; WhatsApp links break | ✅ Fixed |
| BUG-12 | 🔴 High | UX/i18n | Phone placeholder hardcoded to `+216` for every user, in a France⇄Tunisia app | ✅ Fixed |
| BUG-13 | 🟠 Medium-High | Design | Login screen entirely in English while the app is French | ✅ Fixed |
| BUG-14 | 🟠 Medium | Design | Tab bars in English; the sender bar mixes both languages | ✅ Fixed |
| BUG-15 | 🟠 Medium | Domain | Trips never leave `SCHEDULED` — 5 of 7 production trips have already departed | ⚠️ Data fixed, no job yet |
| BUG-16 | 🟠 Medium | Domain | Nothing stops a booking on a trip that has already departed | ✅ Fixed |
| BUG-17 | 🟠 Medium | UX | Over-capacity error is a raw English `RuntimeException` message | ✅ Fixed |
| BUG-18 | 🟡 Low-Med | Domain | No guard against a transporter booking their own trip | ✅ Fixed |
| BUG-19 | 🟡 Low-Med | Data | Legacy trip with `1e+31` kg capacity still in the database | ✅ Fixed in prod |
| BUG-21 | 🟠 Medium | Domain | `createTrip` never validated dates (past trips, arrival before departure) | ✅ Fixed |
| BUG-20 | 🟡 Low | Feature gap | Trip-alert opt-out has no in-app toggle, only an email link | ⬜ Open |

### What was changed

**Frontend** (`logistics-app`)

- `app/utils/phone.ts` *(new)* — E.164 normalisation, per-country validation, and `toWhatsAppDigits()` which returns `null` when a number cannot produce a working `wa.me` link
- `components/meridian/PhoneField.tsx` *(new)* — phone input with an explicit country picker (FR, TN, IT, BE, DE, ES)
- Both registration screens now store E.164 and default sensibly: **France for senders, Tunisia for transporters**
- Both WhatsApp buttons now **hide** when the number can't work, instead of rendering a no-op
- Login screen and both tab bars translated to French; English field labels replaced app-wide

**Backend** (`transportation-app`)

- `createBooking` rejects trips that have already departed, and rejects a transporter booking their own trip. Pre-validation failures fall through to the authoritative capacity check rather than blocking the booking
- `TripInfoDTO` *(new)* + typed `CatalogClient.getTripInfo` — the existing untyped `getTripById` is untouched so enrichment keeps working
- `updateTripCapacity` throws a French `IllegalArgumentException` naming the real figures
- `createTrip` validates dates: both required, arrival after departure, departure not in the past

**Production data** (`migrationId:6`, already applied)

- `1e+31` capacity row corrected to 1000 kg
- 4 departed trips moved `SCHEDULED` → `COMPLETED`

### Still outstanding

- **BUG-10 data:** all three transporters still have no phone. The code no longer lies about it, but until the numbers are filled in, WhatsApp contact remains unavailable for every transporter. This needs a human — the numbers aren't in the system to migrate.
- **BUG-11 legacy row:** `0245468795` is stored without a country code. It looks like a French landline, but guessing would be wrong as often as right, so it was left alone. Best fixed by asking that user to re-enter it.
- **BUG-15 job:** the data is corrected, but nothing yet advances trips automatically. A scheduled task is still needed or the problem returns.

---

## 🔴 BUG-10 — No transporter has a phone number, so WhatsApp contact is dead

**Confirmed.** Severity: Critical — this is the product's primary contact channel.

Production `db_user`:

| id | email | role | phone |
|---|---|---|---|
| 1 | khaskhoussyammar@gmail.com | TRANSPORTER | *(none)* |
| 2 | karim.transporteur.test@example.com | TRANSPORTER | *(none)* |
| 10 | luxiviastore@gmail.com | TRANSPORTER | *(none)* |

**All three** transporters have no phone. Both WhatsApp entry points guard with:

```ts
const digits = (transporterPhone || '').replace(/[^0-9]/g, '');
if (!digits) return;                     // ← silently does nothing
```

**Observed:** the green "WhatsApp" button on a transporter profile, and
"Contacter … sur WhatsApp" on the shipment tracking screen, look enabled and do
absolutely nothing when tapped.

**Why it happened:** making the phone mandatory (task #34) applied to the
*registration form*. These accounts predate it, and public transporter signup was
later removed by US17 — transporters are now created through a direct endpoint
that does not enforce the field. Nothing backfilled the existing rows.

**Expected:** either the button is hidden/disabled with an explanation when no
phone exists, or transporters are forced to supply one before their trips become
visible. Existing accounts need backfilling either way.

**Files:** `app/transporter-details/[id].tsx:204`, `app/shipment/[id].tsx:99`

---

## 🔴 BUG-11 — Phone numbers stored in incompatible formats; WhatsApp links break

**Confirmed.** Severity: High.

`wa.me` requires a full international number with no `+` and no leading zeros.
The app strips every non-digit and passes the rest straight through:

```ts
Linking.openURL(`https://wa.me/${digits}?text=${text}`);
```

Production data, and what each actually produces:

| Stored | After stripping | Result |
|---|---|---|
| `0245468795` | `0245468795` | ❌ invalid — French national format, no country code |
| `+393520819899` | `393520819899` | ✅ valid (Italy) |

So **one of the three stored numbers already produces a dead link**, and the user
sees WhatsApp's "the phone number shared via link is not on WhatsApp".

The only validation is:

```ts
export const isValidPhone = (v: string) => (v.replace(/[^0-9]/g, '').length >= 8);
```

Eight digits, no country awareness, no normalisation.

**Expected:** normalise to E.164 on save (country selector, or infer and convert
`0X…` → `+33X…` / `+216X…`), validate against the chosen country, and store one
canonical format. Existing rows need migrating.

**Files:** `app/utils/inputFilters.ts:65`, both WhatsApp call sites

---

## 🔴 BUG-12 — Phone placeholder hardcoded to `+216` for everyone

**Confirmed.** Severity: High. *(Reported by the product owner.)*

Both registration screens show the same Tunisian example:

```tsx
placeholder="+216 55 123 456"
```

Sendlo is a **France ⇄ Tunisia** marketplace. Senders are typically in France
(`+33`), and production already contains an **Italian** number (`+39`) — so users
span at least three countries. Showing a Tunisian example to everyone teaches the
wrong format, which is a direct cause of BUG-11.

**Expected:** a country selector defaulting sensibly (France for senders,
Tunisia for transporters, or geo/locale-derived), with the placeholder following
the selection.

**Files:** `app/(auth)/register-sender.tsx:77`, `app/(auth)/register-transporter.tsx:92`

---

## 🟠 BUG-13 — Login screen is entirely in English

**Confirmed** on production. Severity: Medium-High — it is the first screen most
users see.

Rendered at sendlo.fr/login: **"Welcome back"**, "Sign in to Sendlo", "EMAIL",
"PASSWORD", "Forgot password?", "Sign in", "Continue with Google",
"New here? Create account".

Meanwhile the rest of the app is French: "Tableau de bord", "Trajets à venir",
"Réserver ce trajet", "Mes envois".

**Expected:** French throughout — "Bon retour", "Connectez-vous à Sendlo",
"E-MAIL", "MOT DE PASSE", "Mot de passe oublié ?", "Se connecter",
"Continuer avec Google", "Nouveau ici ? Créer un compte".

**Files:** `app/(auth)/login.tsx`

---

## 🟠 BUG-14 — Tab bars in English; sender bar mixes both languages

**Confirmed.** Severity: Medium.

| Bar | Labels |
|---|---|
| Transporter | `Trips` · `Add Trip` · `Profile` |
| Sender | `Search` · **`Mes envois`** · `Profile` |

The sender bar mixes French and English **within a single row of three items**,
which is the most visible possible place for it.

**Expected:** `Trajets` · `Ajouter` · `Profil` and `Rechercher` · `Mes envois` · `Profil`.

**Files:** `app/(transporter)/(tabs)/_layout.tsx:24-32`, `app/(sender)/_layout.tsx:25-39`

**Related:** field labels across the auth screens are also English
(`EMAIL`, `PASSWORD`, `PHONE`, `FULL NAME`, `CONFIRM PASSWORD`).

---

## 🟠 BUG-15 — Trips never leave `SCHEDULED`

**Confirmed** in production `db_catalog`. Severity: Medium.

All 7 trips have `status = 'SCHEDULED'`, including **5 whose departure date has
already passed** (earliest 20 July 2026). There is no transition to
`IN_PROGRESS` or `COMPLETED`, despite the entity documenting all three.

**Consequence:** any logic keyed on status is unreliable. The UI currently hides
this by computing past/upcoming from `departureTime`, which works but means the
status column is decorative.

**Expected:** a scheduled job (or a check on read) that advances trips past their
arrival date to `COMPLETED`.

**Files:** `catalogue-service/.../entity/Trip.java`, `TripService.java`

---

## 🟠 BUG-16 — A trip that has already departed can still be booked

**Suspected** — found by reading `createBooking`, not reproduced.

`BookingService.createBooking` validates the sender, the role and the total
weight, and calls `updateTripCapacity`. **Nothing checks `departureTime`.** The
capacity check is the only gate.

The search UI hides past trips (`/catalog/trips/available` filters correctly, verified),
so this is not reachable by browsing. But it **is** reachable by direct link —
and trip-alert emails now contain permanent `/trip/{id}` links that will still
resolve weeks later.

**Expected:** reject a booking whose trip has departed, with a clear message.

**Files:** `reservation-service/.../BookingService.java`

---

## 🟠 BUG-17 — Over-capacity error surfaces as a raw English message

**Confirmed** by code inspection; the guard itself works correctly.

```java
throw new RuntimeException("Trip Capacity Exceeded");
```

Over-capacity **is** correctly rejected in `TripService.updateTripCapacity` — the
bug is only how it reaches the user. It is a bare `RuntimeException` with an
English message, and `handleRuntimeException` returns 400 **without logging**
(the same blind spot that hid the 12-day mail outage).

**Expected:** a typed exception with a French message naming the actual figures —
"Capacité insuffisante : 12 kg demandés, 5 kg disponibles" — and a log line.

**Files:** `catalogue-service/.../TripService.java`, `GlobalExceptionHandler.java`

---

## 🟡 BUG-18 — No guard against booking your own trip

**Suspected.** Severity: Low-Medium.

No comparison between the booking's `senderId` and the trip's `transporterId`
exists anywhere in `BookingService`. Not reachable through the UI (a transporter
account never sees the booking screens), but the API would accept it.

**Expected:** reject with 400.

---

## 🟡 BUG-19 — Legacy trip with `1e+31` kg capacity still in the database

**Confirmed.** Trip `8b3d1b30…` (Tunis → Paris) still holds
`total_capacity_kg = 1e+31`.

The 1–1000 kg guard added after the original BUG-03 only applies to **new**
trips; this row was never cleaned. It is currently invisible only because its
departure date has passed and `/available` filters by date — not because
anything caught the value.

**Expected:** a one-off data fix, since a future-dated row like this would render
"1e+31 kg libres" to real users.

---

## 🟡 BUG-20 — Trip-alert opt-out has no in-app toggle

**Confirmed** by design. Severity: Low, but worth closing.

`notify_new_trips` can only be changed through the unsubscribe link in an email.
A user who wants to stop the alerts from inside the app has no way to do so, and
one who unsubscribes by accident cannot re-subscribe at all.

**Expected:** a switch on the sender profile screen.

---

## Verified working

Checked and behaving correctly — no action needed:

- **Trip alerts end to end** — publishing fans out to all opted-in senders; 6 mailed, 0 failed, in-app notifications created, route renders with intermediate stops (`Nantes → Paris → Tunis`)
- **Past-trip filtering** on `/catalog/trips/available` — only future trips returned
- **Over-capacity rejection** — correctly refuses to oversell (only the error text is poor, BUG-17)
- **Capacity arithmetic** — no trip has negative or above-total available capacity
- **Date ordering** — no trip has arrival before departure
- **Public trip endpoint** — `GET /catalog/trips/{id}` returns 200 unauthenticated through the gateway
- **`/profile` when logged out** — correctly redirects to login
- **Email delivery** — verification, reset and trip alerts all send through SMTP
- **Unsubscribe tokens** — HMAC generated per recipient, verified in the fan-out payload

---

## Previously reported

Status of the 25 July findings:

| Old ID | Status |
|---|---|
| BUG-01 silent failures | ✅ Fixed — root cause was four competing `<Toast />` instances; load errors now distinct from empty states |
| BUG-02 local backend CORS 400 | ⬜ Open — local environment only, never reproduced from this side |
| BUG-03 unbounded capacity | ⚠️ Partly — guard added for new trips; the bad row survives (BUG-19) |
| BUG-04 non-route files in `app/` | ⬜ Open — deliberately deferred as risky mid-merge |
| BUG-05 layout route warnings | ⬜ Open |
| BUG-06 date format inconsistency | ⬜ Open |
| BUG-07 deprecated RN Web props | ⬜ Open |

---

## Not covered by this pass

Stated plainly so the gaps are visible:

- **No booking was actually created.** Doing so on production would have altered
  real trip capacity, so the booking flow was audited by code and database
  inspection rather than by clicking through it.
- **Native iOS/Android** — web only.
- **The `/trip/{id}` page** — built but not deployed, so the trip-alert button
  currently 404s into the SPA fallback.
- **Load and concurrency** — e.g. two senders booking the last kilo at once. The
  capacity check is not obviously transactional across the service boundary.
