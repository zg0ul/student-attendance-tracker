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

### Test the QR on a real phone (over Wi-Fi)

The QR points at whatever address you open the app from, and in development the
app trusts that address automatically — so you can test the full scan flow on a
phone without deploying:

1. Find your computer's LAN IP (macOS: `ipconfig getifaddr en0`).
2. On the same Wi-Fi, open `http://<that-ip>:3000` on your computer, sign in,
   start a class on `/display`.
3. Scan the projected QR with your phone — it opens `http://<that-ip>:3000/checkin…`
   and check-in works end to end.

> Note: phone geolocation needs HTTPS. Over plain `http://<ip>` the location
> check is skipped (check-in still works); the geofence is enforced once deployed
> over HTTPS.

### Tests

```bash
npm test      # unit tests for the QR token + geofence logic
```

## Deploy with Coolify (recommended)

Coolify provides the database, HTTPS, and domain — so you deploy the app image
directly (no Caddy, no compose). HTTPS is **required**: phone geolocation only
works over HTTPS, which Coolify gives you automatically.

1. **Add a Postgres database**
   Coolify → *New Resource → Database → PostgreSQL*. Create it and copy the
   **internal connection string** (looks like
   `postgres://postgres:<pwd>@<service-name>:5432/postgres`).

2. **Add the application**
   *New Resource → Application → your Git repo*. Set **Build Pack = Dockerfile**
   (the repo's `Dockerfile`). Set the **Port** to `3000`. Attach your domain
   (e.g. `attendance.example.edu`) and enable HTTPS.

3. **Set environment variables** (Application → Environment):
   ```
   DATABASE_URL=<internal connection string from step 1>
   BETTER_AUTH_URL=https://attendance.example.edu   # your real domain
   SHARED_SECRET=<openssl rand -hex 32>
   BETTER_AUTH_SECRET=<openssl rand -hex 32>
   ADMIN_NAME=Dr. Your Name
   ADMIN_EMAIL=you@ju.edu.jo
   ADMIN_PASSWORD=<a strong password>
   NODE_ENV=production
   ```
   (Optional Google Sheets vars from `.env.example` if you want sheet export.)

4. **Link the database to the application.** In Coolify, open the Postgres
   resource → **Connect** (or the app's **Linked resources**) and attach it to
   this app. Without that link the app container is not on the database's Docker
   network and `DATABASE_URL`'s internal hostname will not resolve (`EAI_AGAIN` /
   `ENOTFOUND` in migrate logs).

5. **Deploy.** On first boot the container runs migrations and creates your admin
   account automatically (visible in the deploy logs: `admin created: …`). Open
   your domain and sign in.

> Redeploys are safe — migrations and seeding are idempotent and won't touch
> existing data or recreate the admin.

**Migrate fails with `EAI_AGAIN` or `ENOTFOUND`?** The app container cannot
resolve the Postgres hostname on Docker's internal DNS. Work through this list:

1. **Same project and environment** — the app and Postgres must live in the same
   Coolify project *and* the same environment (e.g. both in `production`). Coolify
   does not route DNS across projects or environments.
2. **Same server / destination** — both resources must be deployed to the same
   Coolify server and destination (check each resource's *Server* and
   *Destination* settings).
3. **Build pack matters**
   - **Dockerfile** (step 2 above): should join the shared Coolify network
     automatically. If DNS still fails, open the app → **Advanced** → enable
     **Connect to Predefined Network** → redeploy.
   - **Docker Compose**: each stack gets its own isolated network by default.
     Either enable **Connect to Predefined Network** on the app *and* use the
     standalone Postgres internal URL, **or** switch to the bundled compose
     option below (simpler).
4. **Re-copy `DATABASE_URL`** from the Postgres resource's **internal** URL (not
   public). If you recreated the database, the hostname changed.
5. **Verify on the server** (SSH into the Coolify host):
   ```bash
   docker ps --format '{{.Names}}' | grep -E 'postgresql|attendance'
   docker network inspect coolify -f '{{range .Containers}}{{.Name}} {{end}}'
   ```
   Both the app and Postgres container names should appear on the `coolify`
   network. If the app is missing, enable **Connect to Predefined Network** and
   redeploy.

### Coolify alternative: bundled Postgres (avoids cross-resource DNS)

If standalone Postgres keeps failing with `EAI_AGAIN`, deploy app + database as
one Docker Compose stack instead:

1. *New Resource → Application → your Git repo*
2. **Build Pack = Docker Compose**
3. **Docker Compose location** = `docker-compose.coolify.yml`
4. **Port** on the `app` service = `3000`
5. Set environment variables (no `DATABASE_URL` needed — compose sets it):
   ```
   POSTGRES_PASSWORD=<strong password>
   BETTER_AUTH_URL=https://attendance.example.edu
   SHARED_SECRET=<openssl rand -hex 32>
   BETTER_AUTH_SECRET=<openssl rand -hex 32>
   ADMIN_NAME=Dr. Your Name
   ADMIN_EMAIL=you@ju.edu.jo
   ADMIN_PASSWORD=<a strong password>
   ```
6. Deploy. The app reaches Postgres at hostname `db` on the compose network.

## Deploy with Docker Compose (alternative, any VPS)

For a plain VPS without Coolify. Caddy handles automatic HTTPS.

1. Point a DNS A-record at the server.
2. Create `.env` (see `.env.example`). Set:
   - `DOMAIN=attendance.example.edu`
   - `BETTER_AUTH_URL=https://attendance.example.edu`
   - strong `SHARED_SECRET`, `BETTER_AUTH_SECRET` (`openssl rand -hex 32`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
   - `POSTGRES_PASSWORD`
   - `DATABASE_URL` is overridden by compose to reach the `db` service.
3. `docker compose up -d --build`

The app runs migrations + seed on start, served on `:3000` behind Caddy
(`:80`/`:443`). Postgres data persists in the `pgdata` volume.

## Running a class

1. Professor opens `/display`, picks Day + Class, clicks **Show QR**.
2. Students scan with their phone camera, enter Student ID, choose their department, tap **Mark me present**.
3. The live counter updates; the QR auto-refreshes.

## Admin panel (`/admin`)

- **Attendance** — view check-ins, filter by session, **Export CSV** (and **Push
  to Google Sheet** if configured).
- **Professors** — create accounts, set role, activate/deactivate, delete.
- **Roster** — import `StudentID,Name` (CSV or paste); existing IDs are updated.
- **Sessions** — set days × classes (regenerates the grid) and label sessions.
- **Settings** — geofence on/off, classroom lat/lng (or "use my location"),
  radius, QR rotation window, grace windows, max check-ins per device, department list for check-in.

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

`Timestamp · Session Number · Day · Period · Student ID · Student Name · Department ·
Professor · Device ID · Distance (m) · Status`
