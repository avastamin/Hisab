import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.test.local");
} catch {
  // No local test credentials: the signed-in tests skip themselves.
}

// End-to-end tests run against the dev server (started here unless one is already running on port 3000).
// The signed-in tests need a dedicated test account in E2E_EMAIL / E2E_PASSWORD (e.g. in .env.test.local, which
// is gitignored); without them only the signed-out tests run. They create data prefixed "E2E " and delete it again.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000/login", reuseExistingServer: true, timeout: 120_000 },
});
