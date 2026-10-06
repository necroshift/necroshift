import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  // Specs share one live dev Postgres and seed/wipe the same tables, so
  // cross-file parallelism races; one worker keeps every file serialized.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm --filter web dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
