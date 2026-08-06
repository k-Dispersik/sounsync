import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./shared/auth/AuthProvider";
import AppRouter from "./routers";

// Server state here is kept fresh by realtime events, not by polling, so the
// defaults are turned down: a refetch on every window focus would race the
// optimistic edits a peer just sent us and make clips jump.
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const container = document.getElementById("root");

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
            </QueryClientProvider>
        </React.StrictMode>,
    );
}
