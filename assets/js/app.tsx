import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./routers";
import Workspace from "./pages/user/workspace";


const container = document.getElementById("root");

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <AppRouter />
            <Workspace />
        </React.StrictMode>
    );
}
