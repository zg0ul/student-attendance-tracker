# Employability Readiness — Attendance

QR-based classroom attendance for large courses (500+ students, 10 days × 3
classes). Professors project a rotating QR; students scan, enter their ID, and
are marked present. Built to resist proxy attendance and to be self-hosted.

Rebuild of an earlier Google Apps Script tool (`legacy/`) as a Next.js app with
a real database, professor accounts, and an admin panel.

## How it resists proxy attendance

- **Rotating signed QR** — the QR encodes an HMAC token bound to the session and
  valid for ~1 window (default 60s + 1 grace). A screenshot goes stale fast and a
  code from one session can't be reused in another.
- **One ID per session** — enforced by a DB unique constraint.
- **One device per session** — configurable (default 1) so a single phone can't
  mark many people.
- **Optional geofence** — reject check-ins outside a radius of the classroom.
- **Roster names** — names come from the uploaded roster, never typed by students.

## Stack

Next.js (App Router) · Postgres + Drizzle · better-auth (email/password, roles) ·
shadcn/ui + Tailwind · TanStack Query · Docker + Caddy.

## Roles

- **Admin** — manages professors, roster, sessions, geofence/QR settings, and
  exports data. Seeded from `.env` on first run.
- **Professor** — runs the projection page (`/display`) for their classes.
  Professor identity comes from the logged-in account (no impersonation).

## Local development

Requires Node 20+ and a Postgres database.

```bash
cp .env.example .env          # fill SHARED_SECRET, BETTER_AUTH_SECRET, ADMIN_*
# point DATABASE_URL at your Postgres, then:
npm install
npm run db:migrate            # apply migrations
npm run seed                  # settings + session grid + first admin
npm run dev
```

Open http://localhost:3000 and sign in with the admin credentials from `.env`.

> `BETTER_AUTH_URL` must match the origin you actually serve from (scheme + host
> + port). A mismatch causes `Invalid origin` errors on sign-in.

### Tests

```bash
npm test      # unit tests for the QR token + geofence logic
```

## Deployment (self-host VPS, Docker)

HTTPS is **required** — browser geolocation only works over HTTPS. Caddy obtains
a certificate automatically when `DOMAIN` is a real hostname.

1. Point a DNS A-record at the server.
2. Create `.env` (see `.env.example`). Set:
   - `DOMAIN=attendance.example.edu`
   - `BETTER_AUTH_URL=https://attendance.example.edu`
   - strong `SHARED_SECRET`, `BETTER_AUTH_SECRET` (`openssl rand -hex 32`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
   - `POSTGRES_PASSWORD`
   - `DATABASE_URL` is overridden by compose to reach the `db` service.
3. Bring it up:

```bash
docker compose up -d --build
```

The app container runs migrations + seed (idempotent) on start, then serves on
`:3000` behind Caddy (`:80`/`:443`). Postgres data persists in the `pgdata` volume.

## Running a class

1. Professor opens `/display`, picks Day + Class, clicks **Show QR**.
2. Students scan with their phone camera, enter Student ID, tap **Mark me present**.
3. The live counter updates; the QR auto-refreshes.

## Admin panel (`/admin`)

- **Attendance** — view check-ins, filter by session, **Export CSV** (and **Push
  to Google Sheet** if configured).
- **Professors** — create accounts, set role, activate/deactivate, delete.
- **Roster** — import `StudentID,Name` (CSV or paste); existing IDs are updated.
- **Sessions** — set days × classes (regenerates the grid) and label sessions.
- **Settings** — geofence on/off, classroom lat/lng (or "use my location"),
  radius, QR rotation window, grace windows, max check-ins per device.

### Optional: Google Sheets export

Set in `.env` (CSV export always works regardless):

```
GOOGLE_SHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=svc@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Share the target sheet with the service-account email (Editor). "Push to Google
Sheet" overwrites the sheet with the current export.

## Columns exported

`Timestamp · Session Number · Day · Period · Student ID · Student Name ·
Professor · Device ID · Distance (m) · Status`
