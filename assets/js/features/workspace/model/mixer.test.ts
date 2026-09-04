import { describe, expect, it } from "vitest";

import {
    EMPTY_MIXER,
    effectiveGain,
    isSoloing,
    setMaster,
    setVolume,
    toggleMute,
    toggleSolo,
    trackMix,
} from "./mixer";

describe("the mixer", () => {
    it("a track nobody has touched is heard at full volume", () => {
        expect(effectiveGain(EMPTY_MIXER, 1)).toBe(1);
        expect(trackMix(EMPTY_MIXER, 1)).toEqual({ volume: 1, muted: false, soloed: false });
    });

    it("volume scales the track", () => {
        expect(effectiveGain(setVolume(EMPTY_MIXER, 1, 0.5), 1)).toBe(0.5);
    });

    it("the master scales everything", () => {
        const mixer = setMaster(setVolume(EMPTY_MIXER, 1, 0.5), 0.5);

        expect(effectiveGain(mixer, 1)).toBe(0.25);
    });

    it("muting silences the track and nothing else", () => {
        const mixer = toggleMute(EMPTY_MIXER, 1);

        expect(effectiveGain(mixer, 1)).toBe(0);
        expect(effectiveGain(mixer, 2)).toBe(1);
    });

    it("muting is a gain of zero, not a lost volume setting", () => {
        const muted = toggleMute(setVolume(EMPTY_MIXER, 1, 0.7), 1);

        expect(effectiveGain(muted, 1)).toBe(0);
        expect(effectiveGain(toggleMute(muted, 1), 1)).toBeCloseTo(0.7, 10);
    });

    it("solo silences every track that is not soloed", () => {
        const mixer = toggleSolo(EMPTY_MIXER, 1);

        expect(isSoloing(mixer)).toBe(true);
        expect(effectiveGain(mixer, 1)).toBe(1);
        expect(effectiveGain(mixer, 2)).toBe(0);
    });

    it("two soloed tracks are both heard", () => {
        const mixer = toggleSolo(toggleSolo(EMPTY_MIXER, 1), 2);

        expect(effectiveGain(mixer, 1)).toBe(1);
        expect(effectiveGain(mixer, 2)).toBe(1);
        expect(effectiveGain(mixer, 3)).toBe(0);
    });

    it("unsoloing the last soloed track brings everyone back", () => {
        const mixer = toggleSolo(toggleSolo(EMPTY_MIXER, 1), 1);

        expect(isSoloing(mixer)).toBe(false);
        expect(effectiveGain(mixer, 2)).toBe(1);
    });

    it("mute wins over solo on the same track", () => {
        const mixer = toggleMute(toggleSolo(EMPTY_MIXER, 1), 1);

        expect(effectiveGain(mixer, 1)).toBe(0);
    });

    it("levels stay inside a sensible range", () => {
        expect(effectiveGain(setVolume(EMPTY_MIXER, 1, 5), 1)).toBe(1);
        expect(effectiveGain(setVolume(EMPTY_MIXER, 1, -3), 1)).toBe(0);
        expect(effectiveGain(setVolume(EMPTY_MIXER, 1, Number.NaN), 1)).toBe(0);
    });

    it("changes do not mutate what was there before", () => {
        const before = setVolume(EMPTY_MIXER, 1, 0.4);
        const after = toggleMute(before, 1);

        expect(effectiveGain(before, 1)).toBeCloseTo(0.4, 10);
        expect(effectiveGain(after, 1)).toBe(0);
    });
});
