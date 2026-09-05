/**
 * A clip's waveform, drawn as one element.
 *
 * Fifty bars used to be fifty divs, and a project with a few dozen clips paid
 * for that on every render. An SVG path costs one node whatever the resolution,
 * and scales with the clip because the viewBox does the arithmetic.
 */
export default function Waveform({
    values,
    color,
    className = "",
}: {
    /** One value per column, 0..1. */
    values: number[];
    color: string;
    className?: string;
}) {
    if (values.length === 0) return null;

    const width = values.length;
    // Mirrored around the middle, the way a waveform is usually drawn.
    const top = values.map((value, index) => `${index},${50 - value * 45}`);
    const bottom = [...values].reverse().map((value, index) => {
        return `${width - 1 - index},${50 + value * 45}`;
    });

    return (
        <svg
            aria-hidden="true"
            viewBox={`0 0 ${width} 100`}
            preserveAspectRatio="none"
            className={`h-full w-full ${className}`}
        >
            <polygon points={[...top, ...bottom].join(" ")} fill={color} fillOpacity={0.6} />
        </svg>
    );
}
