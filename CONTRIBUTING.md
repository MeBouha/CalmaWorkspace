# Contributing to Calma WorkSpace

We are a team of 3. These rules keep `main` working and avoid merge conflicts.

## Golden rules

1. **Never push directly to `main`.** All changes go through a Pull Request (PR).
2. **One branch = one task** (a user story, a bug fix, a refactor). Keep it small.
3. **Every PR is reviewed by at least one teammate** before merging.
4. **`main` must always build and pass tests.**

## Daily workflow

```bash
# 1. Start from the latest main
git switch main
git pull

# 2. Create a branch for your task
git switch -c feat/us-04-rooms

# 3. Work and commit often
git add <files>
git commit -m "feat(rooms): add room creation form"

# 4. Before opening the PR, bring in the latest main and re-run checks
git fetch origin
git merge origin/main          # fix any conflicts on YOUR branch
npm run lint && npm run typecheck && npm test

# 5. Push and open a PR on GitHub
git push -u origin feat/us-04-rooms
```

After the PR is approved, merge it on GitHub and delete the branch. Everyone else then runs
`git switch main && git pull` before starting their next task.

## Branch names

| Prefix   | Use for                          | Example                     |
|----------|----------------------------------|-----------------------------|
| `feat/`  | new feature / user story         | `feat/us-06-availability`   |
| `fix/`   | bug fix                          | `fix/login-redirect`        |
| `chore/` | setup, config, dependencies      | `chore/add-ci`              |
| `docs/`  | documentation only               | `docs/readme-setup`         |
| `test/`  | tests only                       | `test/availability-buffer`  |

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary in imperative mood>
```

Examples: `feat(auth): add logout endpoint`, `fix(rooms): reject capacity <= 0`,
`test(availability): cover buffer overlap`.

## Pull Requests

- Title follows the commit format; description says **what** and **why**, links the user story (e.g. `US-04`).
- Keep PRs small (ideally < 400 changed lines). Big PRs are hard to review and conflict more.
- Reviewer checks: it works, tests cover it, no secrets, server-side role checks are present.
- Merge within 1–2 days. Long-lived branches cause conflicts.

## Conflict hotspots — be careful

- **`prisma/schema.prisma`** — everyone needs it. Keep schema changes in their own small PR,
  merge fast, and tell the team. After pulling a schema change run:
  `npx prisma migrate dev` (then `npm run prisma:seed` if needed).
- **`package-lock.json`** — on conflict, take `main`'s version, then run `npm install` and commit the result.
  Don't hand-edit it.
- **Shared files** (`src/lib/*`, layouts, nav bar) — announce in the group chat before big changes.

## Never commit

- `.env` (use `.env.example` for new variables)
- `*.db` SQLite databases
- `node_modules/`, `.next/`, binaries (`*.exe`)

## Who owns what (Sprint 1)

Ownership just means "first reviewer / main author", everyone can touch anything.

| Area                                   | Stories             |
|----------------------------------------|---------------------|
| Auth, sessions, RBAC                   | US-01, US-02        |
| Manager admin (agents, rooms, settings)| US-03, US-04, US-05 |
| Availability search, seed, tests       | US-06               |
