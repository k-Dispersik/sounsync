/** The editor actions that have a key of their own. */
export type Shortcut = "play-pause" | "toggle-mute" | "toggle-solo" | "delete";

const KEYS: Record<string, Shortcut> = {
    " ": "play-pause",
    m: "toggle-mute",
    s: "toggle-solo",
    Delete: "delete",
    Backspace: "delete",
};

/**
 * Whether the keystroke is being typed into something.
 *
 * A DAW binds bare letters, which is only safe as long as a name being typed
 * into a field never doubles as a command: "s" in a project title must not
 * solo a track.
 */
function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    // jsdom does not implement isContentEditable, so the attribute is checked
    // as well — the tests would otherwise pass on something untrue.
    if (target.isContentEditable || target.getAttribute("contenteditable") === "true") return true;

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The action a keystroke asks for, if any.
 *
 * Modified keys are left alone: Ctrl+S is the browser's, and taking it would
 * be a worse surprise than not having a shortcut at all.
 */
export function shortcutFor(event: KeyboardEvent): Shortcut | null {
    if (event.metaKey || event.ctrlKey || event.altKey) return null;
    if (isTypingTarget(event.target)) return null;

    return KEYS[event.key] ?? KEYS[event.key.toLowerCase()] ?? null;
}
