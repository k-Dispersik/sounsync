import { useState, useEffect, useCallback } from "react";
import { getProject } from "../api/projects";
import type { Project, ProjectSettings } from "../../../shared/types/index";
import type { Track } from "../../../shared/types/index";
import type { Clip } from "../../../shared/types/index";

export function useProject(id: number) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetch = useCallback(() => {
        setIsLoading(true);
        getProject(id).then((project) => {
            setProject(project);
            setIsLoading(false);
        });
    }, [id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const addClip = useCallback((trackId: number, clip: Clip) => {
        setProject((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                tracks: prev.tracks.map((t) =>
                    t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t,
                ),
            };
        });
    }, []);

    const updateClipInState = useCallback(
        (trackId: number, clipId: number, changes: Partial<Clip>) => {
            setProject((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    tracks: prev.tracks.map((t) =>
                        t.id === trackId
                            ? {
                                  ...t,
                                  clips: t.clips.map((c) =>
                                      c.id === clipId ? { ...c, ...changes } : c,
                                  ),
                              }
                            : t,
                    ),
                };
            });
        },
        [],
    );

    const updateSettings = useCallback((settings: ProjectSettings) => {
        setProject((prev) => (prev ? { ...prev, settings } : prev));
    }, []);

    const addTrack = useCallback((track: Track) => {
        setProject((prev) => (prev ? { ...prev, tracks: [...prev.tracks, track] } : prev));
    }, []);

    const removeTrack = useCallback((trackId: number) => {
        setProject((prev) =>
            prev ? { ...prev, tracks: prev.tracks.filter((t) => t.id !== trackId) } : prev,
        );
    }, []);

    return {
        project,
        isLoading,
        refetch: fetch,
        addClip,
        updateClipInState,
        updateSettings,
        addTrack,
        removeTrack,
    };
}
