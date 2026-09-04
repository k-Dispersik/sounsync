/**
 * Per-track levels, and what they add up to.
 *
 * Kept as a pure calculation because solo is the part that surprises people:
 * it is not a property of the soloed track but of every other one. Whether a
 * track is heard depends on the whole mixer, so that is what the function takes.
 */
export interface TrackMix {
    volume: number;
    muted: boolean;
    soloed: boolean;
}

export interface MixerState {
    master: number;
    tracks: Record<number, TrackMix>;
}

export const DEFAULT_TRACK_MIX: TrackMix = { volume: 1, muted: false, soloed: false };

export const EMPTY_MIXER: MixerState = { master: 1, tracks: {} };

export function trackMix(mixer: MixerState, trackId: number): TrackMix {
    return mixer.tracks[trackId] ?? DEFAULT_TRACK_MIX;
}

export function isSoloing(mixer: MixerState): boolean {
    return Object.values(mixer.tracks).some((track) => track.soloed);
}

/**
 * What a track's gain node should be set to.
 *
 * Muting is a gain of zero rather than a disconnected node: disconnecting mid
 * sound produces a click, which is worse than the silence it was meant to make.
 */
export function effectiveGain(mixer: MixerState, trackId: number): number {
    const track = trackMix(mixer, trackId);

    if (track.muted) return 0;
    if (isSoloing(mixer) && !track.soloed) return 0;

    return clamp(track.volume) * clamp(mixer.master);
}

export function setVolume(mixer: MixerState, trackId: number, volume: number): MixerState {
    return update(mixer, trackId, (track) => ({ ...track, volume: clamp(volume) }));
}

export function toggleMute(mixer: MixerState, trackId: number): MixerState {
    return update(mixer, trackId, (track) => ({ ...track, muted: !track.muted }));
}

export function toggleSolo(mixer: MixerState, trackId: number): MixerState {
    return update(mixer, trackId, (track) => ({ ...track, soloed: !track.soloed }));
}

export function setMaster(mixer: MixerState, master: number): MixerState {
    return { ...mixer, master: clamp(master) };
}

function update(
    mixer: MixerState,
    trackId: number,
    change: (track: TrackMix) => TrackMix,
): MixerState {
    return {
        ...mixer,
        tracks: { ...mixer.tracks, [trackId]: change(trackMix(mixer, trackId)) },
    };
}

function clamp(value: number): number {
    if (!Number.isFinite(value)) return 0;

    return Math.min(1, Math.max(0, value));
}
