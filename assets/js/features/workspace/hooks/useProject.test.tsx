import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "js/shared/types";
import * as api from "../api/projects";
import { useProject } from "./useProject";

vi.mock("../api/projects", () => ({ getProject: vi.fn() }));

const project: Project = {
    id: 1,
    title: "Session",
    description: null,
    settings: { bpm: 120, time_signature: "4/4", timeline_length_ms: 60_000 },
    tracks: [
        {
            id: 10,
            project_id: 1,
            row_index: 0,
            clips: [
                {
                    id: 100,
                    title: "Kick",
                    type: "drums",
                    start_time: 0,
                    duration: 1_000,
                    file_path: "samples/kick.wav",
                },
            ],
        },
    ],
};

function setup() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    return renderHook(() => useProject(1), {
        wrapper: ({ children }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
}

describe("useProject", () => {
    beforeEach(() => {
        vi.mocked(api.getProject).mockResolvedValue(structuredClone(project));
    });

    it("loads the project once", async () => {
        const { result } = setup();

        expect(result.current.isLoading).toBe(true);
        await waitFor(() => expect(result.current.project?.title).toBe("Session"));
        expect(api.getProject).toHaveBeenCalledOnce();
    });

    it("D-9: a failed request ends in an error state, not an endless spinner", async () => {
        vi.mocked(api.getProject).mockRejectedValue(new Error("boom"));

        const { result } = setup();

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.project).toBeNull();
    });

    it("adds a clip a peer created without refetching", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.project).not.toBeNull());

        act(() =>
            result.current.addClip(10, {
                id: 101,
                title: "Snare",
                type: "drums",
                start_time: 500,
                duration: 250,
                file_path: "samples/snare.wav",
            }),
        );

        await waitFor(() => expect(result.current.project?.tracks[0]?.clips).toHaveLength(2));
        expect(api.getProject).toHaveBeenCalledOnce();
    });

    it("moves a clip in place", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.project).not.toBeNull());

        act(() => result.current.updateClipInState(10, 100, { start_time: 4_000 }));

        await waitFor(() =>
            expect(result.current.project?.tracks[0]?.clips[0]?.start_time).toBe(4_000),
        );
    });

    it("adds and removes tracks", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.project).not.toBeNull());

        act(() => result.current.addTrack({ id: 11, project_id: 1, row_index: 1, clips: [] }));
        await waitFor(() => expect(result.current.project?.tracks).toHaveLength(2));

        act(() => result.current.removeTrack(10));
        await waitFor(() =>
            expect(result.current.project?.tracks.map((track) => track.id)).toEqual([11]),
        );
    });

    it("keeps settings changes in the same cache entry", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.project).not.toBeNull());

        act(() =>
            result.current.updateSettings({
                bpm: 90,
                time_signature: "7/8",
                timeline_length_ms: 120_000,
            }),
        );

        await waitFor(() => expect(result.current.project?.settings.bpm).toBe(90));
    });
});
