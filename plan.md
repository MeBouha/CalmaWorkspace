You are OpenCode, an expert full-stack developer. Build the Sprint 1 increment of a web application for “Calma WorkSpace”, a co-working/revision center. Work autonomously in the current repository. If something is ambiguous, make a reasonable choice, document it in README.md, and continue. Do not stop to ask questions unless truly blocking.

## 1. Project context
Calma WorkSpace rents rooms to students, high-school pupils, developers, and entrepreneurs for individual work, group work, meetings, or training. The final product will handle booking, pricing, payment, receipts, and daily planning. YOU MUST IMPLEMENT ONLY SPRINT 1.

Sprint 1 objective: accounts, authentication, role-based access, manager configuration of rooms and booking rules, and read-only room availability search.

Sprint 1 scope — implement exactly these user stories:
- US-01: As a visitor, I can create an account so I can book later.
- US-02: As a user, I can log in and log out, and only access pages for my role, to protect data.
- US-03: As a manager, I can create and deactivate follow-up-agent and payment-agent accounts to control access.
- US-04: As a manager, I can add, edit, and deactivate rooms (name, type, capacity, equipment) to reflect the center’s offer.
- US-05: As a manager, I can define opening hours, maximum booking duration, and buffer time between bookings to frame reservations.
- US-06: As a client, I can see free rooms by date, time slot, and number of people to choose a suitable room.

Do NOT implement Sprint 2/3 features: no booking creation, no booking cancellation, no payment, no receipt, no daily planning, no monthly subscription, no notifications, no dashboard analytics, no attendance tracking. You MAY create a read-only Booking model and seed bookings only to make availability search realistic. Do not expose any endpoint that creates or edits bookings.

## 2. Tech stack
Use:
- Next.js 14+ with App Router and TypeScript
- Tailwind CSS for UI
- Prisma ORM with SQLite for development
- bcryptjs for password hashing
- jose for JWT session cookies
- Zod for server-side validation
- date-fns for date/time handling
- Jest + React Testing Library for unit/component tests
- Playwright for critical acceptance tests if feasible; otherwise Jest integration tests for API logic
- ESLint and TypeScript strict mode

Use French UI labels. Use English identifiers in code. Make the UI responsive and accessible. Add a clean, simple design with a Calma WorkSpace brand feel.

## 3. Roles and account model
Roles:
- CLIENT
- MANAGER
- FOLLOW_UP_AGENT
- PAYMENT_AGENT

Client profiles (only for CLIENT):
- STUDENT
- HIGH_SCHOOL_STUDENT
- DEVELOPER
- ENTREPRENEUR

Rules:
- Public registration creates only CLIENT accounts. User chooses client profile during registration.
- MANAGER accounts are seeded only; no public manager registration.
- Manager can create FOLLOW_UP_AGENT and PAYMENT_AGENT accounts with a temporary password.
- Manager can deactivate/reactivate agents. Manager cannot deactivate another manager or self.
- Inactive users cannot log in.
- Passwords are hashed with bcryptjs (>=10 rounds). Never store plain passwords.
- Session: httpOnly, sameSite=lax, secure in production, JWT expiry 8h. Logout clears cookie.
- Middleware and server-side guards must enforce RBAC. Do not rely only on hiding UI.

## 4. Database schema
Create Prisma models:

User:
- id String @id @default(cuid())
- email String @unique
- passwordHash String
- fullName String
- role Role
- clientType ClientType?
- active Boolean @default(true)
- createdAt DateTime @default(now())
- updatedAt DateTime @updatedAt

enum Role { CLIENT MANAGER FOLLOW_UP_AGENT PAYMENT_AGENT }
enum ClientType { STUDENT HIGH_SCHOOL_STUDENT DEVELOPER ENTREPRENEUR }

Room:
- id String @id @default(cuid())
- name String
- type RoomType
- capacity Int
- equipment String  // JSON array string or comma-separated; display as chips
- active Boolean @default(true)
- createdAt DateTime @default(now())
- updatedAt DateTime @updatedAt

enum RoomType { INDIVIDUAL MULTI_PERSON MEETING TRAINING }

CenterSettings singleton:
- id String @id @default("singleton")
- openingTime String // "08:00"
- closingTime String // "20:00"
- maxDurationMinutes Int // e.g. 240
- bufferMinutes Int // e.g. 15
- updatedAt DateTime @updatedAt

Booking (read-only in Sprint 1, for availability only):
- id String @id @default(cuid())
- roomId String
- startAt DateTime
- endAt DateTime
- participants Int
- status String @default("CONFIRMED")
- room Room @relation(...)

Seed data:
- Manager: manager@calma.tn / Manager123!
- Follow-up agent: suivi@calma.tn / Agent123!
- Payment agent: paiement@calma.tn / Agent123!
- Clients: etudiant@calma.tn / Client123!, eleve@calma.tn / Client123!, dev@calma.tn / Client123!, entrepreneur@calma.tn / Client123!
- Rooms: “Salle Solo 1” (INDIVIDUAL, cap 1, equipment: table, prise, Wi-Fi), “Salle Duo” (MULTI_PERSON, cap 2), “Salle Réunion A” (MEETING, cap 8, projecteur, tableau blanc, visio), “Salle Formation” (TRAINING, cap 20, projecteur, sonorisation). All active.
- CenterSettings: 08:00–20:00, max 240 min, buffer 15 min.
- Seed a few bookings relative to the current date (e.g. tomorrow 10:00–12:00 for Salle Réunion A) so availability search can demonstrate unavailable rooms. Use dates relative to today, not hard-coded past dates.

## 5. Pages and UI
Public:
- `/` landing page describing Calma WorkSpace, links to login/register.
- `/register` form: fullName, email, password, confirm password, clientType. Validate email, password strength, duplicate email.
- `/login` form. On success redirect by role.

Client:
- `/client/availability`: form with date, start time, duration in minutes (or end time), number of participants. Submit to availability API. Show free rooms as cards: name, type, capacity, equipment chips. Show clear empty state and validation errors.
- Client nav: availability, logout.

Manager:
- `/manager` or `/manager/dashboard`: simple protected landing with links.
- `/manager/agents`: list agents, create agent form (fullName, email, role FOLLOW_UP_AGENT or PAYMENT_AGENT, temporary password), deactivate/reactivate button. Show status.
- `/manager/rooms`: list rooms; create/edit form with name, type, capacity, equipment; deactivate/reactivate. Show active/inactive.
- `/manager/settings`: form for openingTime, closingTime, maxDurationMinutes, bufferMinutes. Validate opening < closing, positive max duration, buffer >= 0.
- Manager nav: agents, rooms, settings, logout.

Agents:
- `/agent/planning` protected for FOLLOW_UP_AGENT only. Placeholder: “Planning du jour — disponible au Sprint 3.”
- `/agent/payments` protected for PAYMENT_AGENT only. Placeholder: “Paiements et reçus — disponibles au Sprint 3.”
- Agent nav: their placeholder page + logout.

Also:
- `/unauthorized` page.
- Nav bar shows current user name, role, logout. Hide links by role but still enforce server-side.

## 6. API / server logic
Implement secure server-side endpoints or server actions:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET/POST /api/manager/agents
- PATCH /api/manager/agents/:id/deactivate
- PATCH /api/manager/agents/:id/reactivate
- GET/POST /api/manager/rooms
- PATCH/DELETE? Use PATCH /api/manager/rooms/:id for edit and PATCH /api/manager/rooms/:id/toggle-active
- GET/PATCH /api/manager/settings
- GET /api/availability?date=YYYY-MM-DD&startTime=HH:mm&durationMinutes=60&participants=2

All inputs validated with Zod. All protected endpoints check session and role. Return proper HTTP status codes and JSON error messages in French for UI.

Availability algorithm:
1. Parse and validate date, startTime, durationMinutes, participants.
2. Reject if duration <= 0, participants <= 0, duration > maxDurationMinutes, or slot outside [openingTime, closingTime].
3. Compute startAt and endAt on the selected date.
4. Fetch active rooms with capacity >= participants.
5. For each room, reject if any existing Booking overlaps with buffer:
   overlap if newStart < existingEnd + bufferMinutes AND newEnd > existingStart - bufferMinutes.
6. Return free rooms with name, type, capacity, equipment.
7. Seed bookings must make at least one room unavailable for a demo slot.

## 7. Security and quality
- Hash passwords. Do not return passwordHash in any API.
- Use httpOnly cookie JWT. Validate JWT server-side.
- Protect pages and APIs by role. Manager-only APIs must reject CLIENT and agents.
- Validate and sanitize all inputs.
- Handle duplicate email, invalid login, inactive account, invalid room capacity, invalid settings, and unauthorized access with user-friendly French messages.
- Use Prisma transactions where relevant.
- Add basic rate-limit note in README if not implementing.
- No secrets in code. Provide `.env.example` with `DATABASE_URL`, `JWT_SECRET`.

## 8. Tests
Write and run tests:
- Unit: password hashing/verification, JWT session helpers, RBAC guard, availability validation and buffer/overlap logic.
- Acceptance/integration: register, login, logout, role redirect, manager creates agent, manager deactivates agent, manager room CRUD/toggle, manager settings validation, client availability search with capacity and booking conflict.
- Ensure `npm test` passes. Ensure `npm run build` passes. Ensure `npm run lint` passes.
- Add a short README section listing test accounts, how to run migrations/seed/dev/tests, and Sprint 1 scope.

## 9. Deliverables
Create a complete runnable project with:
- package.json scripts: dev, build, start, lint, test, prisma:migrate, prisma:seed
- prisma/schema.prisma and prisma/seed.ts
- .env.example
- README.md with setup commands:
  npm install
  npx prisma migrate dev --name init
  npm run prisma:seed
  npm run dev
  npm test
- All source files for pages, components, API routes/server actions, auth, RBAC, validation, and tests.
- At the end, summarize what was implemented, list test results, and list any assumptions or limitations. Do not implement Sprint 2/3 features.