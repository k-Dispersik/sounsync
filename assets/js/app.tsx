import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./routers";
import { WorkspaceChannel } from "./services/workspace.channel";
import { WORKSPACE_EVENTS } from "./services/events";

// Test: connect to workspace and handle events
const workspace = new WorkspaceChannel("test-workspace").join();

workspace.on(WORKSPACE_EVENTS.USER_JOINED, (payload) => {
    console.log("[Workspace] user joined", payload);
});

const container = document.getElementById("root");

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <AppRouter />
        </React.StrictMode>
    );
}
