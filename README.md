# Calma WorkSpace

Web app for **Calma WorkSpace**, a coworking and study center (rooms for students, high-school pupils,
developers and entrepreneurs). This repository currently contains **Sprint 1**.

> Team workflow (branches, PRs, commit messages): see [CONTRIBUTING.md](CONTRIBUTING.md).

## Stack

Next.js 15 (App Router, TypeScript strict) · Tailwind CSS 4 · Prisma 6 + SQLite · bcryptjs · jose (JWT cookies)
· Zod · date-fns · Jest + React Testing Library.

## Getting started

Requires Node.js 20+.

```bash
cp .env.example .env              # then set a long random JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                       # http://localhost:3000
```

Other scripts:

| Command             | What it does                                    |
|---------------------|-------------------------------------------------|
| `npm test`          | Unit + integration + component tests (Jest)     |
| `npm run lint`      | ESLint                                          |
| `npm run typecheck` | TypeScript, no emit                             |
| `npm run build`     | Production build                                |
| `npm run prisma:migrate` | Create/apply a migration after a schema change |
| `npm run prisma:seed`    | Reset demo data (idempotent)                   |

Tests use a separate database (`prisma/test.db`) that is recreated on every run; your dev data is not touched.

## Test accounts (after seeding)

| Role              | Email                   | Password      |
|-------------------|-------------------------|---------------|
| Gérant (manager)  | manager@calma.tn        | `Manager123!` |
| Agent de suivi    | suivi@calma.tn          | `Agent123!`   |
| Agent de paiement | paiement@calma.tn       | `Agent123!`   |
| Client étudiant   | etudiant@calma.tn       | `Client123!`  |
| Client élève      | eleve@calma.tn          | `Client123!`  |
| Client développeur| dev@calma.tn            | `Client123!`  |
| Client entrepreneur | entrepreneur@calma.tn | `Client123!`  |

**Availability demo:** log in as a client and search **tomorrow, 10:00, 1 h, 5 people**.
*Salle Réunion A* is booked (10:00–12:00), so only *Salle Formation* is returned.

## Sprint 1 scope

| Story | Description | Where |
|-------|-------------|-------|
| US-01 | Visitor creates a client account (with profile) | `/register`, `POST /api/auth/register` |
| US-02 | Log in / log out, role-based access | `/login`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `src/middleware.ts` |
| US-03 | Manager creates / deactivates / reactivates agents | `/manager/agents`, `/api/manager/agents/**` |
| US-04 | Manager adds / edits / deactivates rooms | `/manager/rooms`, `/api/manager/rooms/**` |
| US-05 | Manager sets opening hours, max duration, buffer | `/manager/settings`, `/api/manager/settings` |
| US-06 | Client searches free rooms by date, slot, people | `/client/availability`, `GET /api/availability` |

Not in Sprint 1 (on purpose): booking creation/cancellation, payment, receipts, daily planning,
subscriptions, notifications, analytics, attendance. The `Booking` table exists **read-only** (seeded) so
the availability search has something to check against. The agent pages are placeholders.

## Project layout

```
prisma/              schema.prisma, seed.ts
src/middleware.ts    first RBAC check (JWT only, edge)
src/lib/             auth guards, session (JWT), password, roles, validation (Zod), availability logic
src/app/api/         route handlers (all re-check session + role + active account in DB)
src/app/             pages (client/, manager/, agent/, login, register, unauthorized)
src/components/      UI components
tests/               unit/, integration/ (route handlers vs. test DB), components/
```

## Security notes

- Passwords hashed with bcrypt (12 rounds; 4 rounds only under `NODE_ENV=test` for speed). Never returned by the API.
- Session: HS256 JWT in an `httpOnly`, `sameSite=lax` cookie (`secure` in production), 8 h expiry. Logout clears it.
- RBAC is enforced twice: in `middleware.ts` and in each API route / page layout. Server guards also check in
  the database that the account is still **active**, so deactivating an agent locks them out immediately.
- The manager can only (de)activate `FOLLOW_UP_AGENT` / `PAYMENT_AGENT` accounts, never themselves or another manager.
  Manager accounts only come from the seed.
- Login returns the same error for unknown email and wrong password, and takes the same time in both cases.
- **No rate limiting yet.** Before production, add rate limiting on `/api/auth/login` and `/api/auth/register`
  (e.g. at the reverse proxy, or with a store such as Redis/Upstash).

## Assumptions

- Times are interpreted in the **server's local time zone** (single-site center). Bookings are stored as `DateTime`.
- Availability search uses start time + duration (not end time). A slot may end exactly at closing time.
- Searching a date in the past is rejected.
- Buffer applies on both sides of an existing booking: a new slot conflicts if
  `newStart < existingEnd + buffer` and `newEnd > existingStart − buffer`.
- Bookings with status `CANCELLED` never block a room (forward-compatible with Sprint 2).
- Room equipment is stored as a JSON array string (SQLite has no array type); the form accepts comma-separated values.
- Rooms are never hard-deleted, only deactivated (keeps history for future bookings).
- Agents get a temporary password chosen by the manager; forcing a change on first login is left for a later sprint.
