import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { parseResponse, ResponseShapeError } from "./parse";
import { projectSchema, projectSummarySchema, sessionSchema } from "./schemas";

const settings = { bpm: 120, time_signature: "4/4", timeline_length_ms: 60_000 };

const project = {
    id: 1,
    title: "Session",
    description: null,
    version: 0,
    settings,
    tracks: [
        {
            id: 2,
            project_id: 1,
            row_index: 0,
            clips: [
                {
                    id: 3,
                    title: "Kick",
                    type: "drums",
                    start_time: 0,
                    duration: 1000,
                    file_path: "samples/kick.wav",
                },
            ],
        },
    ],
};

describe("parseResponse", () => {
    it("returns the parsed body when it matches", () => {
        expect(parseResponse(projectSchema, "GET /projects/1", project)).toEqual(project);
    });

    it("names the offending field when it does not", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const broken = { ...project, settings: { ...settings, bpm: "fast" } };

        expect(() => parseResponse(projectSchema, "GET /projects/1", broken)).toThrow(
            ResponseShapeError,
        );

        try {
            parseResponse(projectSchema, "GET /projects/1", broken);
        } catch (error) {
            expect((error as ResponseShapeError).issues).toContain("settings.bpm");
        }
    });

    it("rejects a project whose tracks were not loaded", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const { tracks: _tracks, ...withoutTracks } = project;

        expect(() => parseResponse(projectSchema, "GET /projects/1", withoutTracks)).toThrow(
            ResponseShapeError,
        );
    });

    it("accepts a summary without associations", () => {
        const summary = { id: 1, title: "Session", description: null, version: 0, settings };

        expect(parseResponse(projectSummarySchema, "GET /projects", summary)).toEqual(summary);
    });

    it("rejects an unknown time signature", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const summary = {
            id: 1,
            title: "Session",
            description: null,
            version: 0,
            settings: { ...settings, time_signature: "11/16" },
        };

        expect(() => parseResponse(projectSummarySchema, "GET /projects", summary)).toThrow();
    });

    it("rejects a session without a token", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        expect(() =>
            parseResponse(sessionSchema, "POST /auth/login", {
                user: { id: 1, name: "Ada", email: "ada@example.com" },
            }),
        ).toThrow(ResponseShapeError);
    });

    it("works with any schema, not just the API ones", () => {
        expect(parseResponse(z.array(z.number()), "test", [1, 2])).toEqual([1, 2]);
    });
});
