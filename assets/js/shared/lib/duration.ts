/**
 * Formats a duration in milliseconds as `m:ss`, or `h:mm:ss` past an hour.
 *
 * Everything in this app stores milliseconds, and more than one place used to
 * print that number with an "s" after it — which turned an eight second sample
 * into "8000s".
 */
export function formatDuration(milliseconds: number | null | undefined): string {
    if (milliseconds == null || !Number.isFinite(milliseconds) || milliseconds < 0) return "—";

    const totalSeconds = Math.round(milliseconds / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    const pad = (value: number) => String(value).padStart(2, "0");

    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
