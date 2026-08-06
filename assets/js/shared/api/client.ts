import axios from "axios";

import { clearToken, readToken } from "@/shared/auth/storage";

const apiClient = axios.create({
    baseURL: "/v1",
    headers: { "Content-Type": "application/json" },
});

// Signing in and signing up are the requests that legitimately answer 401;
// treating those as "your session died" would bounce the user off the very
// page they are trying to use.
const CREDENTIAL_PATHS = ["/auth/login", "/auth/register"];

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Registers what should happen when the server stops accepting our token.
 * The client does not navigate by itself: it reports, and whoever owns the
 * session state decides. That keeps routing out of the transport layer and
 * makes the behaviour testable without a router.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    onUnauthorized = handler;
}

apiClient.interceptors.request.use((config) => {
    const token = readToken();

    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: Error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const url = error.config?.url ?? "";

            if (!CREDENTIAL_PATHS.some((path) => url.endsWith(path))) {
                clearToken();
                onUnauthorized?.();
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
