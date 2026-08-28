import { describe, expect, it } from "vitest";

import { initials, participantColor, toParticipants } from "./presence";

const meta = (overrides: Record<string, unknown> = {}) => ({
    user_id: 1,
    name: "Ada Lovelace",
    session_id: "tab-one",
    color_hue: 137,
    joined_at: "2026-08-28T10:00:00Z",
    ...overrides,
});

describe("toParticipants", () => {
    it("lists everyone who is here", () => {
        const participants = toParticipants({
            "tab-one": { metas: [meta()] },
            "tab-two": {
                metas: [meta({ user_id: 2, name: "Grace Hopper", session_id: "tab-two" })],
            },
        });

        expect(participants.map((p) => p.name)).toEqual(["Ada Lovelace", "Grace Hopper"]);
    });

    it("shows one person once, however many tabs they have open", () => {
        const participants = toParticipants({
            "tab-one": { metas: [meta()] },
            "tab-two": { metas: [meta({ session_id: "tab-two" })] },
        });

        expect(participants).toHaveLength(1);
        expect(participants[0]?.sessions).toBe(2);
    });

    it("orders people by when they first arrived", () => {
        const participants = toParticipants({
            late: {
                metas: [meta({ user_id: 2, name: "Late", joined_at: "2026-08-28T12:00:00Z" })],
            },
            early: {
                metas: [meta({ user_id: 3, name: "Early", joined_at: "2026-08-28T08:00:00Z" })],
            },
        });

        expect(participants.map((p) => p.name)).toEqual(["Early", "Late"]);
    });

    it("an empty room is an empty list", () => {
        expect(toParticipants({})).toEqual([]);
    });

    it("nonsense from the wire is not rendered", () => {
        expect(toParticipants({ broken: { metas: [{ user_id: "one" }] } })).toEqual([]);
        expect(toParticipants(null)).toEqual([]);
        expect(toParticipants(undefined)).toEqual([]);
    });
});

describe("participantColor", () => {
    it("is the same colour for the same person everywhere", () => {
        expect(participantColor(137)).toBe(participantColor(137));
        expect(participantColor(137)).not.toBe(participantColor(200));
    });
});

describe("initials", () => {
    it("takes at most two", () => {
        expect(initials("Ada Lovelace")).toBe("AL");
        expect(initials("Ada Byron King Lovelace")).toBe("AB");
    });

    it("copes with one name, or none", () => {
        expect(initials("Ada")).toBe("A");
        expect(initials("   ")).toBe("");
    });
});
