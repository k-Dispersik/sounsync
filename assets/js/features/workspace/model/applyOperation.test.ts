import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Clip, Project, Track } from "@/shared/types";
import { applyOperation } from "./applyOperation";
import { OPERATIONS, type OperationEvent } from "./operations";

const clip = (overrides: Partial<Clip> = {}): Clip => ({
    id: 100,
    title: "Kick",
    type: "drums",
    start_time: 0,
    duration: 1_000,
    file_path: null,
    track_id: 10,
    ...overrides,
});

const track = (overrides: Partial<Track> = {}): Track => ({
    id: 10,
    project_id: 1,
    row_index: 0,
    clips: [clip()],
    ...overrides,
});

const project = (overrides: Partial<Project> = {}): Project => ({
    id: 1,
    title: "Session",
    description: null,
    version: 4,
    settings: { bpm: 120, time_signature: "4/4", timeline_length_ms: 60_000 },
    tracks: [track()],
    ...overrides,
});

const event = (type: string, payload: unknown, version = 5): OperationEvent => ({
    type,
    version,
    payload,
});

beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("applyOperation", () => {
    it("records the version the operation carried", () => {
        const next = applyOperation(project(), event(OPERATIONS.TRACK_CREATE, track({ id: 11 })));

        expect(next.version).toBe(5);
    });

    it("adds a track", () => {
        const next = applyOperation(
            project(),
            event(OPERATIONS.TRACK_CREATE, track({ id: 11, clips: [] })),
        );

        expect(next.tracks.map((t) => t.id)).toEqual([10, 11]);
    });

    it("removes a track", () => {
        const next = applyOperation(project(), event(OPERATIONS.TRACK_DELETE, { track_id: 10 }));

        expect(next.tracks).toEqual([]);
    });

    it("adds a clip to its track", () => {
        const next = applyOperation(
            project(),
            event(OPERATIONS.CLIP_CREATE, clip({ id: 101, start_time: 2_000 })),
        );

        expect(next.tracks[0]?.clips.map((c) => c.id)).toEqual([100, 101]);
    });

    it("does not add the same clip twice", () => {
        const next = applyOperation(project(), event(OPERATIONS.CLIP_CREATE, clip()));

        expect(next.tracks[0]?.clips).toHaveLength(1);
    });

    it("moves a clip within a track", () => {
        const next = applyOperation(
            project(),
            event(OPERATIONS.CLIP_MOVE, clip({ start_time: 4_000 })),
        );

        expect(next.tracks[0]?.clips[0]?.start_time).toBe(4_000);
    });

    it("moves a clip to another track without leaving a copy behind", () => {
        const twoTracks = project({ tracks: [track(), track({ id: 11, clips: [] })] });

        const next = applyOperation(
            twoTracks,
            event(OPERATIONS.CLIP_MOVE, clip({ track_id: 11, start_time: 500 })),
        );

        expect(next.tracks[0]?.clips).toHaveLength(0);
        expect(next.tracks[1]?.clips.map((c) => c.id)).toEqual([100]);
    });

    it("deletes a clip", () => {
        const next = applyOperation(
            project(),
            event(OPERATIONS.CLIP_DELETE, { clip_id: 100, track_id: 10 }),
        );

        expect(next.tracks[0]?.clips).toEqual([]);
    });

    it("replaces the settings", () => {
        const next = applyOperation(
            project(),
            event(OPERATIONS.SETTINGS_UPDATE, {
                settings: { bpm: 90, time_signature: "7/8", timeline_length_ms: 120_000 },
            }),
        );

        expect(next.settings.bpm).toBe(90);
        expect(next.tracks).toHaveLength(1);
    });

    describe("refusing what it cannot apply", () => {
        it("leaves the project alone for an unknown operation", () => {
            const before = project();

            expect(applyOperation(before, event("project.nuke", {}))).toBe(before);
        });

        it("refuses a clip that does not say which track it belongs to", () => {
            const before = project();
            const { track_id: _missing, ...withoutTrack } = clip();

            expect(applyOperation(before, event(OPERATIONS.CLIP_CREATE, withoutTrack))).toBe(
                before,
            );
        });

        it("leaves the project alone when the payload is not what it claims", () => {
            const before = project();

            expect(applyOperation(before, event(OPERATIONS.CLIP_CREATE, { id: "abc" }))).toBe(
                before,
            );
        });

        it("ignores an operation for a track it does not have", () => {
            const before = project();

            expect(
                applyOperation(before, event(OPERATIONS.CLIP_CREATE, clip({ track_id: 999 }))),
            ).toBe(before);
        });

        it("does not advance the version when nothing was applied", () => {
            const next = applyOperation(project(), event("project.nuke", {}, 99));

            expect(next.version).toBe(4);
        });
    });
});
