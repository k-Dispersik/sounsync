import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TrackLanes from "./TrackLanes";

const lanes = {
    totalBeats: 16,
    beatWidth: 48,
    beatsPerBar: 4,
    pixelsPerMillisecond: 0.1,
    scale: { beatWidth: 48, pixelsPerMillisecond: 0.1 } as never,
    hoveredBeat: null,
    hoveredTrackId: null,
    selectedBeat: null,
    selectedTrackId: null,
    onBeatHover: () => undefined,
    onBeatLeave: () => undefined,
    onBeatClick: () => undefined,
};

describe("TrackLanes", () => {
    it("shows placeholders while the project is on its way", () => {
        const { container } = render(<TrackLanes tracks={[]} isLoading {...lanes} />);

        expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
        expect(screen.queryByText("No tracks yet")).not.toBeInTheDocument();
    });

    it("a project with no tracks says so, rather than looking broken", () => {
        render(<TrackLanes tracks={[]} isLoading={false} {...lanes} />);

        expect(screen.getByText("No tracks yet")).toBeInTheDocument();
    });
});
