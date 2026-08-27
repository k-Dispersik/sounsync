import { useEffect, useState } from "react";

import type { ConnectionStatus } from "../model/connection";

const RESYNC_NOTICE_MS = 6_000;

/**
 * Says when the connection is gone, and admits when coming back replaced what
 * was on screen.
 *
 * Reconnecting takes a fresh snapshot rather than replaying whatever the
 * client did while it was offline, so an edit made during the gap can vanish.
 * Losing work quietly is the part worth avoiding; the notice makes it visible.
 */
export default function ConnectionBanner({ status }: { status: ConnectionStatus }) {
    const [showResynced, setShowResynced] = useState(false);

    useEffect(() => {
        if (status !== "resynced") return;

        setShowResynced(true);
        const timer = setTimeout(() => setShowResynced(false), RESYNC_NOTICE_MS);

        return () => clearTimeout(timer);
    }, [status]);

    if (status === "reconnecting") {
        return (
            <div
                role="status"
                className="px-4 py-1.5 text-xs text-center bg-warning/15 text-base-content/70"
            >
                Connection lost — reconnecting…
            </div>
        );
    }

    if (showResynced) {
        return (
            <div
                role="status"
                className="px-4 py-1.5 text-xs text-center bg-info/15 text-base-content/70"
            >
                Reconnected. The project was refreshed from the server.
            </div>
        );
    }

    return null;
}
