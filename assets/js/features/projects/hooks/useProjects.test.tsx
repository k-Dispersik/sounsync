import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Project, ProjectSummary } from "@/shared/types";
import * as api from "../api/projects";
import { useProjects } from "./useProjects";

vi.mock("../api/projects", () => ({
    getProjects: vi.fn(),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
}));

const settings = { bpm: 120, time_signature: "4/4", timeline_length_ms: 60_000 } as const;

const summary = (id: number, title: string): ProjectSummary => ({
    id,
    title,
    description: null,
    version: 0,
    settings,
});

const created: Project = { ...summary(7, "Fresh"), tracks: [] };

function setup() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return renderHook(() => useProjects(), {
        wrapper: ({ children }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
}

beforeEach(() => {
    vi.mocked(api.getProjects).mockResolvedValue([summary(1, "First"), summary(2, "Second")]);
    vi.mocked(api.createProject).mockResolvedValue(created);
    vi.mocked(api.deleteProject).mockResolvedValue(undefined);
});

describe("useProjects", () => {
    it("lists what the server has", async () => {
        const { result } = setup();

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.projects.map((project) => project.title)).toEqual([
            "First",
            "Second",
        ]);
    });

    it("reports a failure instead of showing an empty list", async () => {
        vi.mocked(api.getProjects).mockRejectedValue(new Error("nope"));
        const { result } = setup();

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.projects).toEqual([]);
    });

    it("shows a new project without asking the server again", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.createProject({ title: "Fresh" });
        });

        await waitFor(() =>
            expect(result.current.projects.map((project) => project.title)).toEqual([
                "First",
                "Second",
                "Fresh",
            ]),
        );
        expect(api.getProjects).toHaveBeenCalledOnce();
    });

    it("a created project is stored as a summary, without its tracks", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.createProject({ title: "Fresh" });
        });

        await waitFor(() => expect(result.current.projects).toHaveLength(3));
        expect(result.current.projects.at(-1)).not.toHaveProperty("tracks");
    });

    it("drops a deleted project from the list", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.removeProject(1);
        });

        await waitFor(() =>
            expect(result.current.projects.map((project) => project.id)).toEqual([2]),
        );
        expect(api.deleteProject).toHaveBeenCalledWith(1);
    });

    it("keeps the list intact when the delete fails", async () => {
        vi.mocked(api.deleteProject).mockRejectedValue(new Error("nope"));
        const { result } = setup();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.removeProject(1);
        });

        await waitFor(() => expect(result.current.removingId).toBeNull());
        expect(result.current.projects.map((project) => project.id)).toEqual([1, 2]);
    });
});
