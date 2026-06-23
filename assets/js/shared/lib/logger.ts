/**
 * The only module allowed to touch `console` (enforced by the `no-console`
 * ESLint rule).
 *
 * Warnings and errors always reach the console: hiding them in production is
 * how bug reports turn into "it just stopped working". The chatty levels are
 * opt-in per browser, so a normal session stays readable:
 *
 *     localStorage.setItem("soundsync:debug", "1")
 */

const DEBUG_KEY = "soundsync:debug";

function debugEnabled(): boolean {
    try {
        return localStorage.getItem(DEBUG_KEY) === "1";
    } catch {
        // Private mode and some embedded webviews throw on localStorage access.
        return false;
    }
}

export interface Logger {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}

export function createLogger(scope: string): Logger {
    const prefix = `[${scope}]`;

    return {
        debug: (...args) => {
            if (debugEnabled()) console.debug(prefix, ...args);
        },
        info: (...args) => {
            if (debugEnabled()) console.info(prefix, ...args);
        },
        warn: (...args) => console.warn(prefix, ...args),
        error: (...args) => console.error(prefix, ...args),
    };
}
