import { useTransportContext } from "../contextProviders/TransportProvider";

interface TimelineMarkersProps {
    barEndLines: number[];
    barEndKeyPrefix?: string;
}

export function BarEndMarkers({ barEndLines, barEndKeyPrefix = "bar-end" }: TimelineMarkersProps) {
    return (
        <>
            {barEndLines.map((x, index) => (
                <div
                    key={`${barEndKeyPrefix}-${index}`}
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-base-content/50"
                    style={{ left: x - 1 }}
                />
            ))}
        </>
    );
}

export function PlayheadMarker({ pixelsPerMillisecond }: { pixelsPerMillisecond: number }) {
    const { isPlaying, playheadPosition } = useTransportContext();

    return (
        <>
            {(isPlaying || playheadPosition !== 0) && (
                <div
                    className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-red-400/90"
                    style={{ left: playheadPosition * pixelsPerMillisecond }}
                />
            )}
        </>
    );
}
