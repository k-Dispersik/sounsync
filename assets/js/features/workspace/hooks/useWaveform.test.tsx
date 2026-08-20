import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../api/peaks";
import { useWaveform } from "./useWaveform";

vi.mock("../api/peaks", () => ({ getWaveform: vi.fn() }));

function setup(audioFileId: number | null, barCount: number) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return renderHook(() => useWaveform(1, audioFileId, barCount), {
        wrapper: ({ children }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
}

describe("useWaveform", () => {
    beforeEach(() => {
        vi.mocked(api.getWaveform).mockResolvedValue({
            columns: [0, 0.25, 0.5, 1, 0.75, 0.5, 0.25, 0],
            peaksPerSecond: 512,
        });
    });

    it("reduces the columns to the number of bars being drawn", async () => {
        const { result } = setup(7, 4);

        await waitFor(() => expect(result.current.bars).not.toBeNull());
        expect(result.current.bars).toHaveLength(4);
    });

    it("keeps the loudest value in each pool rather than sampling", async () => {
        const { result } = setup(7, 2);

        await waitFor(() => expect(result.current.bars).not.toBeNull());
        // The 1.0 in the first half must survive being pooled with its quieter
        // neighbours: a kick that disappears is exactly the bug this avoids.
        expect(result.current.bars?.[0]).toBe(1);
    });

    it("asks for nothing when the clip has no audio behind it", () => {
        const { result } = setup(null, 8);

        expect(api.getWaveform).not.toHaveBeenCalled();
        expect(result.current.bars).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it("gives no bars for a file that has not been analysed yet", async () => {
        vi.mocked(api.getWaveform).mockResolvedValue({ columns: [], peaksPerSecond: 512 });
        const { result } = setup(7, 4);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.bars).toBeNull();
    });

    it("survives a request that fails", async () => {
        vi.mocked(api.getWaveform).mockRejectedValue(new Error("nope"));
        const { result } = setup(7, 4);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.bars).toBeNull();
    });
});
