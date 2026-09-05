import { render } from "@testing-library/react";
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
    });

    it("draws nothing for a project with no tracks: the grid says why", () => {
        const { container } = render(<TrackLanes tracks={[]} isLoading={false} {...lanes} />);

        expect(container).toBeEmptyDOMElement();
    });
});
