import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./routers";

const container = document.getElementById("root");

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <AppRouter />
        </React.StrictMode>
    );
}
