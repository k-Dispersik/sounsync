import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./routers";

const queryClient = new QueryClient();

const container = document.getElementById("root");

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <AppRouter />
            </QueryClientProvider>
        </React.StrictMode>,
    );
}
