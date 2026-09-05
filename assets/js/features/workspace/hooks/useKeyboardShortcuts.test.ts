import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

const press = (key: string) => window.dispatchEvent(new KeyboardEvent("keydown", { key }));

afterEach(() => {
    document.body.innerHTML = "";
});

describe("useKeyboardShortcuts", () => {
    it("runs the handler for the key that was pressed", () => {
        const playPause = vi.fn();
        renderHook(() => useKeyboardShortcuts({ "play-pause": playPause }));

        press(" ");

        expect(playPause).toHaveBeenCalledOnce();
    });

    it("ignores keys nobody asked for", () => {
        const remove = vi.fn();
        renderHook(() => useKeyboardShortcuts({ delete: remove }));

        press(" ");

        expect(remove).not.toHaveBeenCalled();
    });

    it("keeps its hands off the keyboard while a dialog is open", () => {
        const playPause = vi.fn();
        const dialog = document.createElement("dialog");
        dialog.setAttribute("open", "");
        document.body.append(dialog);
        renderHook(() => useKeyboardShortcuts({ "play-pause": playPause }));

        press(" ");

        expect(playPause).not.toHaveBeenCalled();
    });

    it("calls the handler it was last given, not the one it started with", () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = renderHook(
            ({ handler }: { handler: () => void }) =>
                useKeyboardShortcuts({ "play-pause": handler }),
            { initialProps: { handler: first } },
        );

        rerender({ handler: second });
        press(" ");

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });

    it("stops listening once it is gone", () => {
        const playPause = vi.fn();
        const { unmount } = renderHook(() => useKeyboardShortcuts({ "play-pause": playPause }));

        unmount();
        press(" ");

        expect(playPause).not.toHaveBeenCalled();
    });
});
