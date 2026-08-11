# WORKORDER 001

**Status:** IN_PROGRESS
**Branch:** fix/02
**Repos:** both

## Goal

Ship the bug-report fixes and the CI/CD changes that are currently sitting
uncommitted in both working trees. When this is finished, both repos build in
CI, and production deploys carry infrastructure config rather than images alone.

This order is deliberately the first one because it also **proves the loop
works** — and because the backend changes in it have never been compiled by
anyone.

## Changes

Everything is already written. Do not rewrite it — commit what is there, fix
only what fails to build.

**logistics-app** — commit exactly these, nothing else:

- `app/utils/phone.ts` *(new)* — E.164 normalisation, `toWhatsAppDigits`
- `components/meridian/PhoneField.tsx` *(new)* — country picker
- `app/(auth)/login.tsx` — French translation
- `app/(auth)/register-sender.tsx`, `app/(auth)/register-transporter.tsx` — PhoneField
- `app/(auth)/forgot-password.tsx`, `app/(auth)/reset-password.tsx` — French labels
- `app/(sender)/_layout.tsx`, `app/(transporter)/(tabs)/_layout.tsx` — French tabs
- `app/shipment/[id].tsx`, `app/transporter-details/[id].tsx` — hide dead WhatsApp button
- `.github/workflows/verify.yml` *(new)*
- `BUG_REPORT.md`, `AUTOMATION_PLAN.md`, `AUTOMATION_ROADMAP.md`, `orchestrator/*`

**Do not commit** `app/(auth)/verify-code.tsx`, `app/(auth)/verify-email.tsx`, or
`nginx.conf` — they contain only CRLF→LF churn, zero real changes. Verify with
`git diff --ignore-cr-at-eol --numstat` before staging.

**transportation-app** — commit exactly these:

- `reservation-service/.../dto/TripInfoDTO.java` *(new)*
- `reservation-service/.../client/CatalogClient.java` — typed `getTripInfo`
- `reservation-service/.../service/BookingService.java` — departed-trip and self-booking guards
- `catalogue-service/.../service/TripService.java` — date validation, French capacity error
- `.github/workflows/verify.yml` *(new)*
- `.github/workflows/CI.yml` — scp config to server before deploy
- `migration.sql` — migrationId:6

## Verify before pushing

- [ ] `npx tsc --noEmit` in logistics-app — **7 errors is the baseline**, do not exceed it
- [ ] `npx expo export --platform web` — must produce a bundle
- [ ] `mvn clean install -DskipTests` in transportation-app — **must pass**
- [ ] `git diff --cached --name-only` matches the lists above exactly

> The Maven build is the important one. These backend files have never been
> compiled. Expect errors; fix them; report exactly what they were.

## Acceptance

Orchestrator will confirm, over SSH:

1. Both `verify.yml` workflows run green on `fix/02`
2. After merge, the deploy reports config sync and both domains return 200
3. `docker exec catalogue-service printenv NOTIFICATION_SERVICE_URL` still resolves
4. Publishing a trip still fans out alerts

## Do not

- Do not merge. Push the branch only.
- Do not run migrations or touch the production database.
- Do not "fix" the 7 pre-existing tsc errors — out of scope.
- Do not reformat or normalise line endings across the tree.
- Do not add features. This order ships what already exists.
