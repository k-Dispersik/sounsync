/**
 * Rate limiting for things that fire far faster than anyone can see.
 *
 * Two shapes, because the two problems are different. A pointer moving wants
 * the *latest* value delivered regularly — that is throttling. A setting being
 * typed wants only the *final* value delivered once — that is debouncing.
 * Using the wrong one either floods the wire or drops the answer.
 */

export interface Throttled<Args extends unknown[]> {
    (...args: Args): void;
    /** Sends the most recent call immediately, if one is pending. */
    flush(): void;
    cancel(): void;
}

/** Calls `fn` at most once per `intervalMs`, keeping the most recent arguments. */
export function throttle<Args extends unknown[]>(
    fn: (...args: Args) => void,
    intervalMs: number,
    now: () => number = Date.now,
): Throttled<Args> {
    let lastCall = 0;
    let pending: Args | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const send = (args: Args) => {
        lastCall = now();
        pending = null;
        fn(...args);
    };

    const throttled = ((...args: Args) => {
        const elapsed = now() - lastCall;

        if (elapsed >= intervalMs) {
            send(args);
            return;
        }

        // Hold the newest arguments and let the timer deliver them: dropping
        // the last move of a drag would leave the clip drawn where it is not.
        pending = args;

        timer ??= setTimeout(() => {
            timer = null;
            if (pending) send(pending);
        }, intervalMs - elapsed);
    }) as Throttled<Args>;

    throttled.flush = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        if (pending) send(pending);
    };

    throttled.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
        pending = null;
    };

    return throttled;
}

export interface Debounced<Args extends unknown[]> {
    (...args: Args): void;
    cancel(): void;
}

/** Calls `fn` once, `delayMs` after the last call. */
export function debounce<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delayMs: number,
): Debounced<Args> {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const debounced = ((...args: Args) => {
        if (timer) clearTimeout(timer);

        timer = setTimeout(() => {
            timer = null;
            fn(...args);
        }, delayMs);
    }) as Debounced<Args>;

    debounced.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
    };

    return debounced;
}
