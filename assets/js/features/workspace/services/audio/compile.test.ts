import { describe, expect, it } from "vitest";

import type { Clip, Project, Track } from "@/shared/types";
import { compileProject } from "./compile";

const clip = (overrides: Partial<Clip> = {}): Clip => ({
    id: 100,
    track_id: 10,
    title: "Kick",
    type: "drums",
    start_time: 0,
    duration: 1_000,
    file_path: null,
    audio_file_id: 7,
    ...overrides,
});

const track = (overrides: Partial<Track> = {}): Track => ({
    id: 10,
    project_id: 1,
    row_index: 0,
    clips: [clip()],
    ...overrides,
});

const project = (tracks: Track[]): Project => ({
    id: 1,
    title: "Session",
    description: null,
    version: 1,
    settings: { bpm: 120, time_signature: "4/4", timeline_length_ms: 60_000 },
    tracks,
});

describe("compileProject", () => {
    it("B-8: a clip with audio becomes something to play", () => {
        const { events } = compileProject(project([track()]));

        expect(events).toEqual([
            {
                id: "100",
                timeMs: 0,
                durationMs: 1_000,
                trackId: 10,
                source: { kind: "sample", bufferKey: "7" },
                gain: 1,
            },
        ]);
    });

    it("lists the samples to fetch, once each however many clips use them", () => {
        const { samples } = compileProject(
            project([
                track({ clips: [clip({ id: 1 }), clip({ id: 2, start_time: 2_000 })] }),
                track({ id: 11, clips: [clip({ id: 3, track_id: 11 })] }),
            ]),
        );

        expect(samples).toEqual([{ key: "7", url: "/v1/projects/1/audio_files/7/content" }]);
    });

    it("skips clips with no audio behind them", () => {
        const { events, samples } = compileProject(
            project([track({ clips: [clip({ audio_file_id: null })] })]),
        );

        expect(events).toEqual([]);
        expect(samples).toEqual([]);
    });

    it("puts events in time order, across tracks", () => {
        const { events } = compileProject(
            project([
                track({ clips: [clip({ id: 1, start_time: 4_000 })] }),
                track({ id: 11, clips: [clip({ id: 2, track_id: 11, start_time: 1_000 })] }),
            ]),
        );

        expect(events.map((event) => event.id)).toEqual(["2", "1"]);
    });

    it("keeps overlapping clips as separate events", () => {
        const { events } = compileProject(
            project([
                track({
                    clips: [
                        clip({ id: 1, start_time: 0, duration: 4_000 }),
                        clip({ id: 2, start_time: 1_000, duration: 4_000 }),
                    ],
                }),
            ]),
        );

        expect(events).toHaveLength(2);
    });

    it("never schedules before the start of the timeline", () => {
        const { events } = compileProject(
            project([track({ clips: [clip({ start_time: -500 })] })]),
        );

        expect(events[0]?.timeMs).toBe(0);
    });

    it("an empty or missing project compiles to nothing", () => {
        expect(compileProject(project([]))).toEqual({ events: [], samples: [] });
        expect(compileProject(null)).toEqual({ events: [], samples: [] });
        expect(compileProject(undefined)).toEqual({ events: [], samples: [] });
        expect(compileProject(project([track({ clips: [] })]))).toEqual({
            events: [],
            samples: [],
        });
    });
});
