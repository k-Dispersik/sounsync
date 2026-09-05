import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:4000";

/**
 * Screenshot tests for the screens that matter, in both themes.
 *
 * They run against a real server rather than a mocked one: the point is to
 * catch a token that changed meaning or a layout that collapsed, and neither
 * shows up in a jsdom test. Chrome comes from the machine — there is no reason
 * to download a second copy of a browser that is already installed.
 */
export default defineConfig({
    testDir: "./e2e",
    outputDir: "./e2e/.results",
    snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? "github" : "list",
    use: {
        baseURL,
        channel: "chrome",
        viewport: { width: 1280, height: 800 },
        // Screenshots of an editor mid-animation differ from one run to the
        // next for reasons that have nothing to do with the code.
        launchOptions: { args: ["--force-prefers-reduced-motion"] },
    },
    expect: {
        // Tight on purpose: a tolerance loose enough to absorb a paragraph
        // appearing is a tolerance that would have let it disappear too.
        toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: "disabled" },
    },
    projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "mix phx.server",
        cwd: "..",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
