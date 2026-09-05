import Button from "./Button";

/**
 * What a screen shows when it could not load.
 *
 * Always with a way to try again: an error the user can do nothing about is a
 * dead end, and reloading the whole page is a heavy way to retry one request.
 */
export default function ErrorState({
    title = "This could not be loaded.",
    description,
    onRetry,
    className = "",
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <div
            role="alert"
            className={`flex flex-col items-center justify-center gap-3 px-6 py-10 text-center ${className}`}
        >
            <p className="text-sm text-muted">{title}</p>
            {description && <p className="max-w-xs text-xs text-subtle">{description}</p>}
            {onRetry && (
                <Button variant="primary" size="sm" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </div>
    );
}
