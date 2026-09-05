import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Track } from "@/shared/types";
import TrackRow from "./TrackRow";

vi.mock("./TrackClip", () => ({ default: () => <div data-testid="clip" /> }));

const track: Track = { id: 10, project_id: 1, row_index: 0, clips: [] };

const scale = { bpm: 120, timeSignature: "4/4", pixelsPerBeat: 48 };

function renderRow(overrides: Partial<React.ComponentProps<typeof TrackRow>> = {}) {
    const props = {
        track,
        totalBeats: 480,
        beatWidth: 48,
        beatsPerBar: 4,
        pixelsPerMillisecond: 0.096,
        scale,
        isLast: true,
        hoveredBeat: null,
        hoveredTrackId: null,
        selectedBeat: null,
        selectedTrackId: null,
        onBeatHover: vi.fn(),
        onBeatLeave: vi.fn(),
        onBeatClick: vi.fn(),
        ...overrides,
    };

    return { ...render(<TrackRow {...props} />), props };
}

describe("TrackRow", () => {
    it("P-1: a long project does not become a node per beat", () => {
        const { container } = renderRow({ totalBeats: 480 });

        // Four hundred and eighty beats used to mean nearly a thousand
        // elements in this row alone. The grid is painted now, so the count
        // has nothing to do with the length of the project.
        expect(container.querySelectorAll("*").length).toBeLessThan(20);
    });

    it("the count does not grow with the project", () => {
        const short = renderRow({ totalBeats: 16 }).container.querySelectorAll("*").length;
        cleanupBetween();
        const long = renderRow({ totalBeats: 4_000 }).container.querySelectorAll("*").length;

        expect(long).toBe(short);
    });

    it("is reachable and operable from the keyboard", async () => {
        const onBeatClick = vi.fn();
        renderRow({ onBeatClick, selectedBeat: 3, selectedTrackId: 10 });

        const lane = screen.getByRole("button", { name: "Track 1 timeline" });
        lane.focus();
        await userEvent.keyboard("{ArrowRight}");

        expect(onBeatClick).toHaveBeenCalledWith(4, 10, 0);
    });

    it("does not walk past the start of the timeline", async () => {
        const onBeatClick = vi.fn();
        renderRow({ onBeatClick, selectedBeat: 0, selectedTrackId: 10 });

        screen.getByRole("button", { name: "Track 1 timeline" }).focus();
        await userEvent.keyboard("{ArrowLeft}");

        expect(onBeatClick).toHaveBeenCalledWith(0, 10, 0);
    });

    it("shows the hover marker only on the row the pointer is over", () => {
        const { container } = renderRow({ hoveredBeat: 2, hoveredTrackId: 99 });

        expect(container.querySelector(".bg-hover-overlay")).toBeNull();
    });

    it("renders the clips it is given", () => {
        renderRow({
            track: {
                ...track,
                clips: [
                    {
                        id: 1,
                        track_id: 10,
                        title: "Kick",
                        type: "drums",
                        start_time: 0,
                        duration: 500,
                        file_path: null,
                    },
                ],
            },
        });

        expect(screen.getByTestId("clip")).toBeInTheDocument();
    });
});

function cleanupBetween() {
    document.body.innerHTML = "";
}
