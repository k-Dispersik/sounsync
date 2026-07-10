import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { setUnauthorizedHandler } from "js/shared/api/client";
import { createLogger } from "js/shared/lib/logger";
import * as api from "./api";
import { clearToken, readToken, writeToken } from "./storage";
import type { AuthStatus, AuthUser, Credentials, Registration } from "./types";

const log = createLogger("Auth");

interface AuthContextValue {
    user: AuthUser | null;
    status: AuthStatus;
    login: (credentials: Credentials) => Promise<void>;
    register: (registration: Registration) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    // A stored token proves nothing on its own: it may have expired or been
    // revoked elsewhere, so the session starts by asking the server who we are.
    useEffect(() => {
        const token = readToken();

        if (!token) {
            setStatus("anonymous");
            return;
        }

        let cancelled = false;

        api.fetchCurrentUser(token)
            .then((current) => {
                if (cancelled) return;
                setUser(current);
                setStatus("authenticated");
            })
            .catch(() => {
                if (cancelled) return;
                clearToken();
                setStatus("anonymous");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // A token can stop being accepted between requests. When that happens the
    // client tells us, and the guard sends the user to the sign-in page.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            setUser(null);
            setStatus("anonymous");
        });

        return () => setUnauthorizedHandler(null);
    }, []);

    const start = useCallback((session: { token: string; user: AuthUser }) => {
        writeToken(session.token);
        setUser(session.user);
        setStatus("authenticated");
    }, []);

    const login = useCallback(
        async (credentials: Credentials) => start(await api.login(credentials)),
        [start],
    );

    const register = useCallback(
        async (registration: Registration) => start(await api.register(registration)),
        [start],
    );

    const logout = useCallback(async () => {
        const token = readToken();

        if (token) {
            // Losing the round trip is not a reason to stay logged in locally.
            await api.logout(token).catch((error: unknown) => log.warn("logout failed", error));
        }

        clearToken();
        setUser(null);
        setStatus("anonymous");
    }, []);

    const value = useMemo(
        () => ({ user, status, login, register, logout }),
        [user, status, login, register, logout],
    );

    return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
    const context = use(AuthContext);

    if (!context) throw new Error("useAuth must be used within AuthProvider");

    return context;
}
