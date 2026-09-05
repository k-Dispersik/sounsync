/**
 * A placeholder shaped like the thing that is loading.
 *
 * Shaped like it on purpose: a spinner says "wait", a skeleton says "wait, and
 * here is roughly what you are waiting for", which makes the wait feel shorter
 * and stops the layout jumping when the content lands.
 */
export default function Skeleton({
    className = "",
    count = 1,
}: {
    className?: string;
    count?: number;
}) {
    return (
        <>
            {Array.from({ length: count }, (_unused, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className={`animate-pulse rounded bg-hover-overlay ${className}`}
                />
            ))}
        </>
    );
}
