import { Socket } from "phoenix";

import { readToken } from "@/shared/auth/storage";

// `params` is a function on purpose: the socket outlives a single session, and
// reconnects have to present whatever token is current, not the one that
// happened to be there when this module was first imported.
export const socket = new Socket("/socket", {
    params: () => ({ token: readToken() ?? "" }),
});

/**
 * Opening the socket is deferred until something actually needs it. Connecting
 * at import time would fire a doomed handshake on the sign-in page, where
 * there is no token yet.
 */
export function connectSocket(): void {
    if (socket.connectionState() === "closed") socket.connect();
}
