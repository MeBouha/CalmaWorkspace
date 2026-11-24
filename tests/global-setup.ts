import { execSync } from "node:child_process";

// Syncs the dedicated test database (prisma/test.db) with the schema once per run.
// Non-destructive: each test file clears its own rows (see tests/helpers.ts resetDb).
export default function globalSetup() {
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
