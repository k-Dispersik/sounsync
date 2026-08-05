import axios from "axios";

import apiClient from "js/shared/api/client";
import { parseResponse } from "js/shared/api/parse";
import { sessionSchema, userSchema } from "js/shared/api/schemas";
import type { AuthUser, Credentials, Registration } from "./types";

/** Field name to the messages the server rejected it with. */
export type FieldErrors = Record<string, string[]>;

/** The shape every API error comes back in. */
interface ErrorBody {
    error?: {
        code?: string;
        message?: string;
        details?: FieldErrors;
    };
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

    const body = error.response.data?.error;

    return {
        message: body?.message ?? "Something went wrong. Please try again.",
        fields: body?.details ?? {},
    };
}

function bearer(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
}

export async function login(credentials: Credentials) {
    const { data } = await apiClient.post<unknown>("/auth/login", credentials);
    return parseResponse(sessionSchema, "POST /auth/login", data);
}

export async function register(registration: Registration) {
    const { data } = await apiClient.post<unknown>("/auth/register", registration);
    return parseResponse(sessionSchema, "POST /auth/register", data);
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
    const { data } = await apiClient.get<unknown>("/auth/me", bearer(token));
    return parseResponse(userSchema, "GET /auth/me", data);
}

export async function logout(token: string): Promise<void> {
    await apiClient.delete("/auth/logout", bearer(token));
}
