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
