import type { ReactNode } from "react";

/**
 * What a screen shows when there is nothing on it yet.
 *
 * Empty is a state, not an accident: a blank panel reads as something that
 * failed to load. Saying what would be here, and offering the one action that
 * puts it there, is the difference between "broken" and "new".
 */
export default function EmptyState({
    title,
    description,
    action,
    className = "",
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-2 px-6 py-10 text-center ${className}`}
        >
            <p className="text-sm text-muted">{title}</p>
            {description && <p className="max-w-xs text-xs text-subtle">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
