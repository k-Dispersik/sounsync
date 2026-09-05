import { useEffect, useState } from "react";

import { applyTheme, readTheme, storeTheme, THEMES, type Theme } from "@/shared/lib/theme";
import { Select } from "@/shared/ui";

/**
 * Picks the colour theme.
 *
 * "Match system" is the default and a real option rather than the absence of
 * one: choosing dark on a laptop that switches at sunset should stick. The
 * page shell has already applied the stored choice by the time this renders,
 * so there is nothing to correct on the first pass — only later changes.
 */
export default function ThemeSwitcher() {
    const [theme, setTheme] = useState<Theme>(readTheme);

    useEffect(() => {
        applyTheme(theme);
        storeTheme(theme);
    }, [theme]);

    return <Select label="Theme" value={theme} options={THEMES} onChange={setTheme} />;
}
