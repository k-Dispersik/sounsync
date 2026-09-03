import { readToken } from "@/shared/auth/storage";

/**
 * `fetch` with the session token attached.
 *
 * For the responses that are not JSON — audio, and anything else read as bytes
 * — where the axios client would only get in the way. Same-origin only: the
 * token must never be attached to a request leaving for somewhere else.
 */
export function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
    if (/^https?:\/\//i.test(input)) return fetch(input, init);

    const token = readToken();

    if (!token) return fetch(input, init);

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, { ...init, headers });
}
