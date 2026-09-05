/**
 * The colour a clip is drawn in, by what it holds.
 *
 * One hue per kind is part of the language of the editor: you can see that a
 * lane is drums before you read a single label. The values are tokens, so a
 * theme change moves all of them at once.
 */
const CLIP_COLORS: Record<string, string> = {
    piano: "var(--color-clip-piano)",
    guitar: "var(--color-clip-guitar)",
    drums: "var(--color-clip-drums)",
    bass: "var(--color-clip-bass)",
    recording: "var(--color-clip-recording)",
    effect: "var(--color-clip-effect)",
};

export function clipColor(type: string | null | undefined): string {
    return CLIP_COLORS[type ?? ""] ?? "var(--color-clip-effect)";
}
