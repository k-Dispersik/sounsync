import { useCallback, useRef, useState } from "react";

import { describeAuthError } from "@/shared/auth/api";
import { createLogger } from "@/shared/lib/logger";
import type { AudioFile } from "@/shared/types";
import { announceUpload, completeUpload, sendBytes } from "../api/uploads";

const log = createLogger("Uploads");

export type UploadStage = "preparing" | "sending" | "finishing" | "done" | "failed" | "cancelled";

export interface Upload {
    id: string;
    filename: string;
    stage: UploadStage;
    progress: number;
    error?: string;
    audioFile?: AudioFile;
}

/**
 * Drives the three-step upload: announce, send the bytes, confirm.
 *
 * Each file is tracked separately so one failure does not take the others with
 * it, and every one of them keeps its abort controller — a half-sent fifty
 * megabyte file is exactly the thing a user wants to be able to call off.
 */
export function useUploads(projectId: number, onReady?: (file: AudioFile) => void) {
    const [uploads, setUploads] = useState<Upload[]>([]);
    const controllers = useRef(new Map<string, AbortController>());

    const patch = useCallback((id: string, changes: Partial<Upload>) => {
        setUploads((current) =>
            current.map((upload) => (upload.id === id ? { ...upload, ...changes } : upload)),
        );
    }, []);

    const run = useCallback(
        async (id: string, file: File, signal: AbortSignal) => {
            const announcement = await announceUpload(projectId, file, signal);

            // No instruction means the project already holds these bytes.
            if (announcement.upload) {
                patch(id, { stage: "sending" });
                await sendBytes(announcement.upload, file, {
                    signal,
                    onProgress: (fraction) => patch(id, { progress: fraction }),
                });
            }

            patch(id, { stage: "finishing", progress: 1 });
            const audioFile = await completeUpload(announcement.audio_file.id);

            patch(id, { stage: "done", audioFile });
            onReady?.(audioFile);
        },
        [projectId, patch, onReady],
    );

    const start = useCallback(
        (files: File[]) => {
            for (const file of files) {
                const id = `${file.name}-${Date.now()}-${Math.random()}`;
                const controller = new AbortController();
                controllers.current.set(id, controller);

                setUploads((current) => [
                    ...current,
                    { id, filename: file.name, stage: "preparing", progress: 0 },
                ]);

                run(id, file, controller.signal)
                    .catch((cause: unknown) => {
                        if (controller.signal.aborted) {
                            patch(id, { stage: "cancelled" });
                            return;
                        }

                        log.error(`upload of ${file.name} failed`, cause);
                        patch(id, { stage: "failed", error: describeAuthError(cause).message });
                    })
                    .finally(() => controllers.current.delete(id));
            }
        },
        [run, patch],
    );

    const cancel = useCallback((id: string) => {
        controllers.current.get(id)?.abort();
    }, []);

    const dismiss = useCallback((id: string) => {
        controllers.current.get(id)?.abort();
        setUploads((current) => current.filter((upload) => upload.id !== id));
    }, []);

    return { uploads, start, cancel, dismiss };
}
