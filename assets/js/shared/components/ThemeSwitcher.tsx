import { useEffect, useState } from "react";

import { Select } from "@/shared/ui";

type Theme = "system" | "dark" | "light";

const THEMES = [
    { value: "system", label: "Match system" },
    { value: "dark", label: "Dark" },
    { value: "light", label: "Light" },
] as const;

const STORAGE_KEY = "soundsync:theme";

function read(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);

        return stored === "dark" || stored === "light" ? stored : "system";
    } catch {
        return "system";
    }
}

/**
 * Picks the colour theme.
 *
 * "Match system" is the default and a real option rather than the absence of
 * one: choosing dark on a laptop that switches at sunset should stick.
 */
export default function ThemeSwitcher() {
    const [theme, setTheme] = useState<Theme>(read);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === "system") root.removeAttribute("data-theme");
        else root.setAttribute("data-theme", theme);

        try {
            if (theme === "system") localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // A browser that refuses storage still gets the theme it asked for.
        }
    }, [theme]);

    return <Select label="Theme" value={theme} options={THEMES} onChange={setTheme} />;
}
