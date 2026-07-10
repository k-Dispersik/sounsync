import axios from "axios";

import apiClient from "js/shared/api/client";
import type { AuthUser, Credentials, Registration } from "./types";

interface SessionResponse {
    token: string;
    user: AuthUser;
}

/** Field name to the messages the server rejected it with. */
export type FieldErrors = Record<string, string[]>;

interface ErrorBody {
    error?: string;
    details?: FieldErrors;
}

/**
 * Turns whatever the request threw into something a form can render. A failed
 * login and an unreachable server are different problems for the user, so they
 * get different sentences.
 */
export function describeAuthError(error: unknown): { message: string; fields: FieldErrors } {
    if (!axios.isAxiosError<ErrorBody>(error)) {
        return { message: "Something went wrong. Please try again.", fields: {} };
    }

    if (!error.response) {
        return { message: "Cannot reach the server. Check your connection.", fields: {} };
    }

    const body = error.response.data;

    return {
        message: body?.error ?? "Something went wrong. Please try again.",
        fields: body?.details ?? {},
    };
}

function bearer(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
}

export async function login(credentials: Credentials): Promise<SessionResponse> {
    const { data } = await apiClient.post<SessionResponse>("/auth/login", credentials);
    return data;
}

export async function register(registration: Registration): Promise<SessionResponse> {
    const { data } = await apiClient.post<SessionResponse>("/auth/register", registration);
    return data;
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>("/auth/me", bearer(token));
    return data;
}

export async function logout(token: string): Promise<void> {
    await apiClient.delete("/auth/logout", bearer(token));
}
