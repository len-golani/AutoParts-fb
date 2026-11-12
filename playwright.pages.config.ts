import { defineConfig, devices } from "@playwright/test";

const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./tests",
  testMatch: /pages\.e2e\.ts/,
  timeout: 60000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  retries: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "https://len-golani.github.io/AutoParts-fb/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: channel ?? "chromium",
      use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) },
    },
  ],
});
