import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthProvider";

/**
 * Guards everything behind a session. While the stored token is being checked
 * the children are not rendered at all: mounting a workspace only to unmount
 * it a moment later would fire off requests that are bound to 401.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "loading") {
        return (
            <div
                role="status"
                aria-label="Checking your session"
                className="h-screen flex items-center justify-center text-base-content/40 text-sm"
            >
                Loading…
            </div>
        );
    }

    if (status === "anonymous") {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}
