import { describe, expect, it } from "vitest";

import { nextStatus } from "./connection";

describe("nextStatus", () => {
    it("the first join is simply a connection", () => {
        expect(nextStatus("connecting", "joined")).toBe("connected");
    });

    it("losing the connection is worth showing", () => {
        expect(nextStatus("connected", "dropped")).toBe("reconnecting");
    });

    it("a join after a drop is a resync, not a fresh start", () => {
        expect(nextStatus("reconnecting", "joined")).toBe("resynced");
    });

    it("a drop before the first join is still just connecting", () => {
        // Failing to connect at all is not "reconnecting"; nothing was lost.
        expect(nextStatus("connecting", "dropped")).toBe("connecting");
    });

    it("dropping again while reconnecting changes nothing", () => {
        expect(nextStatus("reconnecting", "dropped")).toBe("reconnecting");
    });

    it("a drop after a resync goes back to reconnecting", () => {
        expect(nextStatus("resynced", "dropped")).toBe("reconnecting");
    });

    it("joining again after a resync keeps it plain", () => {
        expect(nextStatus("resynced", "joined")).toBe("connected");
    });
});
