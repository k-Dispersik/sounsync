import { useEffect, useRef } from "react";

import { shortcutFor, type Shortcut } from "../model/shortcuts";

type Handlers = Partial<Record<Shortcut, () => void>>;

/**
 * Binds the editor's keys, for as long as the component is on screen.
 *
 * The handlers are held in a ref so that a fresh set of closures on every
 * render does not tear the listener down and put it back: a listener that is
 * re-registered sixty times a second is one that will eventually miss a key.
 */
export function useKeyboardShortcuts(handlers: Handlers) {
    const latest = useRef(handlers);
    latest.current = handlers;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            // A dialog owns the keyboard while it is open; Escape closes it,
            // and everything else belongs to whatever is focused inside.
            if (document.querySelector("dialog[open]")) return;

            const shortcut = shortcutFor(event);
            const handler = shortcut ? latest.current[shortcut] : undefined;

            if (!handler) return;

            // Space scrolls the page otherwise, and Backspace used to go back.
            event.preventDefault();
            handler();
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
