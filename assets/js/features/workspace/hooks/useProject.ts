import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { Clip, Project, ProjectSettings, Track } from "@/shared/types";
import { getProject } from "../api/projects";

export const projectQueryKey = (id: number) => ["project", id] as const;

/**
 * The project as the server sees it, kept in the query cache.
 *
 * Realtime events and optimistic edits write into that same cache rather than
 * into a second copy in component state: two copies of the same project is how
 * a peer's change ends up visible in the timeline but missing after a refetch.
 * The mutating helpers below are deliberately local — the API call that makes
 * a change durable is made by whoever owns the interaction.
 */
export function useProject(id: number) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: projectQueryKey(id),
        queryFn: () => getProject(id),
        enabled: Number.isInteger(id) && id > 0,
    });

    const patch = useCallback(
        (update: (project: Project) => Project) => {
            queryClient.setQueryData<Project>(projectQueryKey(id), (previous) =>
                previous ? update(previous) : previous,
            );
        },
        [queryClient, id],
    );

    const patchTrack = useCallback(
        (trackId: number, update: (track: Track) => Track) =>
            patch((project) => ({
                ...project,
                tracks: project.tracks.map((track) =>
                    track.id === trackId ? update(track) : track,
                ),
            })),
        [patch],
    );

    const addClip = useCallback(
        (trackId: number, clip: Clip) =>
            patchTrack(trackId, (track) => ({ ...track, clips: [...track.clips, clip] })),
        [patchTrack],
    );

    const updateClipInState = useCallback(
        (trackId: number, clipId: number, changes: Partial<Clip>) =>
            patchTrack(trackId, (track) => ({
                ...track,
                clips: track.clips.map((clip) =>
                    clip.id === clipId ? { ...clip, ...changes } : clip,
                ),
            })),
        [patchTrack],
    );

    const updateSettings = useCallback(
        (settings: ProjectSettings) => patch((project) => ({ ...project, settings })),
        [patch],
    );

    const addTrack = useCallback(
        (track: Track) => patch((project) => ({ ...project, tracks: [...project.tracks, track] })),
        [patch],
    );

    const removeTrack = useCallback(
        (trackId: number) =>
            patch((project) => ({
                ...project,
                tracks: project.tracks.filter((track) => track.id !== trackId),
            })),
        [patch],
    );

    return {
        project: query.data ?? null,
        isLoading: query.isPending,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        addClip,
        updateClipInState,
        updateSettings,
        addTrack,
        removeTrack,
    };
}
