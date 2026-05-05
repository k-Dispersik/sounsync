import { useTransportContext } from "../contextProviders/TransportProvider";

interface TimelineMarkersProps {
    barEndLines: number[];
    pixelsPerMillisecond: number;
    barEndKeyPrefix?: string;
}

export default function TimelineMarkers({
    barEndLines,
    pixelsPerMillisecond,
    barEndKeyPrefix = "bar-end",
}: TimelineMarkersProps) {
    const { isPlaying, playheadPosition } = useTransportContext();

    return (
        <>
            {barEndLines.map((x, index) => (
                <div
                    key={`${barEndKeyPrefix}-${index}`}
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-gray-500/80"
                    style={{ left: x - 1 }}
                />
            ))}

            {(isPlaying || playheadPosition !== 0) && (
                <div
                    className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-red-400/90"
                    style={{ left: playheadPosition * pixelsPerMillisecond }}
                />
            )}
        </>
    );
}