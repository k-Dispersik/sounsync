import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const THEMES = ["dark", "light"] as const;

const TOKEN_KEY = "soundsync:token";
const THEME_KEY = "soundsync:theme";

interface Account {
    token: string;
    projectId: number;
}

/**
 * A fresh account with one project in it.
 *
 * Fresh on purpose: a shared account would accumulate projects, and the point
 * of a screenshot test is that the same code produces the same picture.
 */
async function seed(request: APIRequestContext): Promise<Account> {
    const email = `screenshots-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

    const registered = await request.post("/v1/auth/register", {
        data: { name: "Ada Lovelace", email, password: "correct horse battery" },
    });
    expect(registered.status()).toBe(201);
    const { token } = (await registered.json()) as { token: string };

    const project = await request.post("/v1/projects", {
        data: { title: "Night session", description: "Two guitars and a drum machine" },
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(project.status()).toBe(201);
    const { id } = (await project.json()) as { id: number };

    return { token, projectId: id };
}

async function open(page: Page, path: string, theme: string, account?: Account) {
    await page.addInitScript(
        ([themeKey, themeValue, tokenKey, token]) => {
            localStorage.setItem(themeKey, themeValue);

            if (token) localStorage.setItem(tokenKey, token);
        },
        [THEME_KEY, theme, TOKEN_KEY, account?.token ?? ""] as const,
    );

    await page.goto(path);
}

for (const theme of THEMES) {
    test.describe(`${theme} theme`, () => {
        test("the sign-in screen", async ({ page }) => {
            await open(page, "/login", theme);

            await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
            await expect(page).toHaveScreenshot(`login-${theme}.png`);
        });

        test("the project list", async ({ page, request }) => {
            const account = await seed(request);
            await open(page, "/projects", theme, account);

            await expect(page.getByRole("link", { name: /Night session/ })).toBeVisible();
            await expect(page).toHaveScreenshot(`projects-${theme}.png`);
        });

        test("an empty workspace", async ({ page, request }) => {
            const account = await seed(request);
            await open(page, `/projects/${account.projectId}`, theme, account);

            await expect(page.getByText("No tracks yet")).toBeVisible();
            await expect(page).toHaveScreenshot(`workspace-${theme}.png`, {
                // The playhead clock and the participant list are the two
                // things on this screen that are allowed to differ.
                mask: [page.getByLabel("Playhead position")],
            });
        });
    });
}
