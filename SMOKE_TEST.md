# Phase 1 Smoke Test

End-to-end walkthrough of the full Phase 1 loop. Run this whenever you want to verify the system works from registration to contact reveal.

---

## Prerequisites

- Docker Desktop running
- Node 20+, pnpm 9+
- Root `.env` file (copy from `.env.example` and fill in `JWT_SECRET`, `JWT_REFRESH_SECRET`)

---

## 1. Start the stack

```bash
# Terminal 1 — database
docker compose up -d

# Terminal 2 — API (http://localhost:3001)
pnpm dev:api

# Terminal 3 — Web (http://localhost:3000)
pnpm dev:web
```

Wait for the API to print `Application is running on: http://[::1]:3001/api/v1`.

---

## 2. Seed

Run both seeders (order matters — seed.ts needs the DB to be migrated first):

```bash
# From the repo root:

# 2a. Apply migrations (first time only — safe to re-run)
pnpm --filter @marketplace/api prisma:migrate

# 2b. Seed admin account
ADMIN_EMAIL=admin@marketplace.lk ADMIN_PASSWORD=Admin@12345 \
  pnpm --filter @marketplace/api seed:admin

# 2c. Seed categories + providers + services
pnpm --filter @marketplace/api seed
```

**What the seed creates:**

| Type | Count | Details |
|------|-------|---------|
| Categories | 9 | 4× VEHICLE_SERVICE, 5× CONSULTATION |
| Providers | 6 | All VERIFIED, spread from Colombo Fort → Homagama |
| Services | 12 | 8× ACTIVE (visible in search), 4× PENDING_VERIFICATION |

**Seeded provider credentials** (all use password `Seed@12345`):

| Email | Business | City | ~km from Fort |
|-------|----------|------|---------------|
| cinnamon.it@seed.lk | Cinnamon IT Solutions | Colombo 7 | 1 km |
| borella.tyres@seed.lk | Borella Tyre Centre | Borella | 2 km |
| perera.auto@seed.lk | Perera Auto Services | Colombo 3 | 3 km |
| silva.legal@seed.lk | Silva & Associates | Nugegoda | 8 km |
| hasitha.repairs@seed.lk | Hasitha Home Repairs | Maharagama | 14 km |
| roshan.clinic@seed.lk | Roshan Medical Centre | Homagama | 14 km |

---

## 3. Happy path — browser walkthrough

Open **http://localhost:3000** in a browser.

---

### 3.1 Register a new provider (manual test)

> Skip this if you only want to test the seeded data. Jump to §3.6.

1. Click **Sign up free** in the navbar.
2. Choose **Provider** role, fill in email/password, submit.
   - Expected: redirected to `/dashboard/provider`.
3. Complete the profile form (business name, contact, address, tick "Set location", enter lat `6.9271` lng `79.8612`), submit.
   - Expected: profile card appears with status badge **Registered**.
4. Upload a document: type = `BUSINESS_REG`, URL = any valid URL (e.g. `https://example.com/doc.pdf`), submit.
   - Expected: document row appears; status badge changes to **Under review** (PENDING_VERIFICATION).
   - Check DB: `SELECT status FROM "ProviderProfile" WHERE "userId" = '<your-id>';` → `PENDING_VERIFICATION`.

---

### 3.2 Admin approves the provider

1. Log out (top-right), then log in as `admin@marketplace.lk` / `Admin@12345`.
   - Expected: navbar shows **Dashboard** link.
2. Go to `/dashboard/admin` — **Providers** tab shows your new provider.
3. Click **Approve provider** → confirm (no notes needed).
   - Expected: provider disappears from the queue; status in DB → `VERIFIED`.

---

### 3.3 Provider creates and submits a service

1. Log out, log in as the provider you registered.
2. In `/dashboard/provider`, scroll to **My Services**, click **+ New service**.
3. Fill in title, description, price, pick a category, submit.
   - Expected: service card appears with status **Draft**.
4. Click **Submit for review** on the service card.
   - Expected: status badge changes to **Pending review**.

---

### 3.4 Admin approves the service

1. Log in as admin, go to `/dashboard/admin`, switch to the **Services** tab.
2. Your service should appear. Click **Approve service** → confirm.
   - Expected: service disappears from queue; status in DB → `ACTIVE`.

---

### 3.5 Public search — verify distance ordering

1. Log out (or open an incognito tab — no login required).
2. Open **http://localhost:3000**.
3. Click **Use my location** OR manually allow geolocation.
   - If denied, the button shows an error; you can still test via step 3a below.

   **3a — quick coordinate test (no GPS needed):**
   Open the browser console and run:
   ```javascript
   // Spoof geolocation to Colombo Fort
   // (this overrides navigator.geolocation.getCurrentPosition for this tab only)
   const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
   navigator.geolocation.getCurrentPosition = (s) =>
     s({ coords: { latitude: 6.9271, longitude: 79.8612, accuracy: 10 }, timestamp: Date.now() });
   ```
   Then click **Set location** in the search bar.

4. Type nothing in the search box, click **Search**.
   - Expected: card grid appears, sorted nearest-first:
     1. Cinnamon IT Solutions (~1 km)
     2. Borella Tyre Centre (~2 km)
     3. Perera Auto Services (~3 km)
     4. Silva & Associates (~8 km)
     5. Hasitha Home Repairs (~14 km)
     6. Roshan Medical Centre (~14 km)
   - Only ACTIVE services show (4× PENDING ones are invisible).

5. Click the **Tyre & Wheel** category chip — results filter to tyre services only.
6. Click **Filters**, change radius to **10 km** — Maharagama and Homagama providers drop off.

---

### 3.6 Open service detail

1. Click any service card.
   - Expected: `/services/<id>` loads with a 2-column layout: service info left, contact card right.
   - Gradient avatar band shows provider initials.
   - **Verified** badge appears.

---

### 3.7 Reveal contact and confirm event written

1. On the service detail page, click **Show phone number**.
   - Expected: button is replaced with the provider's phone number as a `tel:` link.
2. Click **Show email address**.
   - Expected: email shown as a `mailto:` link.

**Verify the event was recorded in the DB:**

```sql
SELECT
  cre.id,
  cre.channel,
  cre."createdAt",
  s.title       AS service,
  pp."businessName" AS provider
FROM "ContactRevealEvent" cre
JOIN "Service"          s  ON s.id  = cre."serviceId"
JOIN "ProviderProfile"  pp ON pp.id = cre."providerProfileId"
ORDER BY cre."createdAt" DESC
LIMIT 10;
```

Expected: one row per reveal click, `channel` alternating between `PHONE` and `EMAIL`.
Each row is the future pay-per-lead billing hook (currently free — Phase 2 TODO).

---

## 4. Database helpers

```bash
# Open Prisma Studio (visual DB browser)
pnpm --filter @marketplace/api prisma:studio

# Count ContactRevealEvents
psql $DATABASE_URL -c 'SELECT COUNT(*) FROM "ContactRevealEvent";'

# Check provider statuses
psql $DATABASE_URL -c 'SELECT "businessName", status FROM "ProviderProfile" ORDER BY "createdAt";'

# Check service statuses
psql $DATABASE_URL -c 'SELECT title, status FROM "Service" ORDER BY "createdAt";'
```

---

## 5. Known TODOs (not Phase 1 scope)

| Location | TODO |
|----------|------|
| `leads.service.ts:35` | Phase 2 — check subscription / charge before revealing contact |
| `search.service.ts:51` | Phase AI — replace ILIKE text search with pgvector semantic search |
| `services.controller.ts` | `/services/:id` (provider-owned) has no public fallback; only `/services/:id/public` is unauthenticated |
