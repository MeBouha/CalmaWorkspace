import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup-after-env.ts"],
  globalSetup: "<rootDir>/tests/global-setup.ts",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"],
};

// jose is ESM-only: let Jest transform it instead of ignoring all of node_modules.
export default async function jestConfig() {
  const resolved = await createJestConfig(config)();
  resolved.transformIgnorePatterns = [
    "/node_modules/(?!(jose)/)",
    ...resolved.transformIgnorePatterns.filter((p) => !p.startsWith("/node_modules/")),
  ];
  return resolved;
}
