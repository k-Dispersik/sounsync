const TOKEN_KEY = "soundsync:token";

/**
 * The session token lives in localStorage rather than a cookie: the API is
 * token-based and stateless, and the socket has to pass the same value as a
 * connect parameter, which a httpOnly cookie could not do.
 */
export function readToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function writeToken(token: string): void {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {
        // A browser that refuses storage still works for one page view.
    }
}

export function clearToken(): void {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {
        // Nothing to clean up if storage was never available.
    }
}
