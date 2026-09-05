import { afterEach, describe, expect, it, vi } from "vitest";

import { applyTheme, readTheme, storeTheme, THEME_STORAGE_KEY } from "./theme";

afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.restoreAllMocks();
});

describe("readTheme", () => {
    it("is the system theme until someone chooses otherwise", () => {
        expect(readTheme()).toBe("system");
    });

    it("remembers a choice", () => {
        storeTheme("light");

        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
        expect(readTheme()).toBe("light");
    });

    it("treats nonsense in storage as no choice at all", () => {
        localStorage.setItem(THEME_STORAGE_KEY, "solarized");

        expect(readTheme()).toBe("system");
    });

    it("survives a browser that refuses storage", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("denied");
        });

        expect(readTheme()).toBe("system");
    });
});

describe("storeTheme", () => {
    it("stores going back to the system theme as no choice", () => {
        storeTheme("dark");
        storeTheme("system");

        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    });

    it("does not throw when storage is refused", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("denied");
        });

        expect(() => storeTheme("dark")).not.toThrow();
    });
});

describe("applyTheme", () => {
    it("marks the document with the chosen theme", () => {
        applyTheme("dark");

        expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("leaves the document unmarked for the system theme", () => {
        applyTheme("dark");
        applyTheme("system");

        expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    });
});
