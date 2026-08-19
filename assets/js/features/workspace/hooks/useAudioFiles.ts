import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import type { AudioFile } from "@/shared/types";
import { listAudioFiles } from "../api/audioFiles";

export const audioFilesQueryKey = (projectId: number) => ["audio-files", projectId] as const;

/**
 * The project's sample library.
 *
 * A file that has just been uploaded is still being analysed, so the list
 * includes pending files: showing one as "processing" is more honest than
 * hiding it and leaving the user to wonder where their upload went.
 */
export function useAudioFiles(projectId: number) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: audioFilesQueryKey(projectId),
        queryFn: () => listAudioFiles(projectId),
        enabled: Number.isInteger(projectId) && projectId > 0,
    });

    const files = query.data ?? [];

    const refresh = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: audioFilesQueryKey(projectId) });
    }, [queryClient, projectId]);

    return {
        files,
        readyFiles: files.filter((file: AudioFile) => file.status === "ready"),
        isLoading: query.isPending,
        isError: query.isError,
        refresh,
    };
}
