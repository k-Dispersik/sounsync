import { describe, expect, it } from "vitest";

import { shortcutFor } from "./shortcuts";

const key = (key: string, overrides: Record<string, unknown> = {}) =>
    ({ key, target: null, ...overrides }) as unknown as KeyboardEvent;

describe("shortcutFor", () => {
    it("knows the four editor keys", () => {
        expect(shortcutFor(key(" "))).toBe("play-pause");
        expect(shortcutFor(key("m"))).toBe("toggle-mute");
        expect(shortcutFor(key("s"))).toBe("toggle-solo");
        expect(shortcutFor(key("Delete"))).toBe("delete");
        expect(shortcutFor(key("Backspace"))).toBe("delete");
    });

    it("does not care about caps lock", () => {
        expect(shortcutFor(key("M"))).toBe("toggle-mute");
        expect(shortcutFor(key("S"))).toBe("toggle-solo");
    });

    it("leaves anything else alone", () => {
        expect(shortcutFor(key("k"))).toBeNull();
        expect(shortcutFor(key("ArrowRight"))).toBeNull();
    });

    it("stays out of the way of the browser's own shortcuts", () => {
        expect(shortcutFor(key("s", { metaKey: true }))).toBeNull();
        expect(shortcutFor(key("s", { ctrlKey: true }))).toBeNull();
        expect(shortcutFor(key("s", { altKey: true }))).toBeNull();
    });

    it("a key typed into a field belongs to the field", () => {
        const input = document.createElement("input");
        const textarea = document.createElement("textarea");
        const note = document.createElement("div");
        note.setAttribute("contenteditable", "true");

        expect(shortcutFor(key("s", { target: input }))).toBeNull();
        expect(shortcutFor(key(" ", { target: textarea }))).toBeNull();
        expect(shortcutFor(key("m", { target: note }))).toBeNull();
    });

    it("but the same key on the timeline is a shortcut", () => {
        const lane = document.createElement("div");

        expect(shortcutFor(key("s", { target: lane }))).toBe("toggle-solo");
    });
});
