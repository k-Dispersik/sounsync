/**
 * The colour theme: what it is, where it is kept, how it is applied.
 *
 * Shared with the inline script in the page shell, which applies the stored
 * theme before the first paint. The two have to agree on the key and on the
 * attribute; that is why both are named here rather than written out twice.
 */
export const THEME_STORAGE_KEY = "soundsync:theme";
export const THEME_ATTRIBUTE = "data-theme";

export const THEMES = [
    { value: "system", label: "Match system" },
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
] as const;

export type Theme = (typeof THEMES)[number]["value"];

function isExplicit(value: unknown): value is "dark" | "light" {
    return value === "dark" || value === "light";
}

/** The stored choice, or "system" when there is none — or no storage at all. */
export function readTheme(): Theme {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);

        return isExplicit(stored) ? stored : "system";
    } catch {
        // Private mode, or storage switched off: the system theme still works.
        return "system";
    }
}

/**
 * Remembers the choice.
 *
 * "System" is stored as the absence of a choice rather than as a value, so a
 * browser that follows the clock keeps following it.
 */
export function storeTheme(theme: Theme): void {
    try {
        if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
        else localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // A browser that refuses storage still gets the theme it asked for.
    }
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
    if (theme === "system") root.removeAttribute(THEME_ATTRIBUTE);
    else root.setAttribute(THEME_ATTRIBUTE, theme);
}
