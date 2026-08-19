import { useEffect, useMemo, useState } from "react";

import type { AudioFile } from "@/shared/types";
import { useAudioFiles } from "./useAudioFiles";
import type { ClipModalState } from "../contextProviders/ClipModalProvider";
import { createClip, updateClip } from "../api/clips";
import { useRealtime } from "../contextProviders/RealtimeProvider";
import { RealtimeEvents } from "../events/events";
import { getOrCreateSessionId } from "../services/signaling/workspaceChannel";

export type ClipType = "piano" | "guitar" | "drums" | "bass" | "recording" | "effect";
export type Tab = "library" | "upload";

/** A row in the library tab: one uploaded file, ready to be placed. */
export interface LibrarySample {
    id: string;
    audioFileId: number;
    title: string;
    duration: number;
}

export const TYPE_META: Record<ClipType, { label: string; icon: string }> = {
    piano: { label: "Piano", icon: "🎹" },
    guitar: { label: "Guitar", icon: "🎸" },
    drums: { label: "Drums", icon: "🥁" },
    bass: { label: "Bass", icon: "🎵" },
    recording: { label: "Recording", icon: "🎤" },
    effect: { label: "Effect", icon: "✨" },
};

export const CLIP_TYPES = Object.keys(TYPE_META) as ClipType[];

// A clip made without a file still needs a length to be drawn at.
const DEFAULT_DURATION_MS = 4000;

function toSample(file: AudioFile): LibrarySample {
    return {
        id: String(file.id),
        audioFileId: file.id,
        title: file.original_filename,
        duration: file.duration_ms ?? DEFAULT_DURATION_MS,
    };
}

import type { Clip } from "@/shared/types";

export type ClipSuccessCallback = (trackId: number, clip: Clip, isEdit: boolean) => void;

export function useClipForm(state: NonNullable<ClipModalState>, onSuccess: ClipSuccessCallback) {
    const { broadcast } = useRealtime();
    const sessionId = getOrCreateSessionId();
    const isEdit = state.kind === "edit";

    const { readyFiles } = useAudioFiles(state.projectId);

    const [tab, setTab] = useState<Tab>("library");
    const [clipType, setClipType] = useState<ClipType>("recording");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<LibrarySample | null>(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadType, setUploadType] = useState<ClipType>("piano");
    const [isSaving, setIsSaving] = useState(false);

    const samples = useMemo(() => readyFiles.map(toSample), [readyFiles]);

    // Editing an existing clip: if it plays a file from the library, start on
    // that file; otherwise the clip was named by hand, so start on the form.
    useEffect(() => {
        if (!isEdit) return;

        const clip = state.clip;
        const match = samples.find((sample) => sample.audioFileId === clip.audio_file_id);

        if (match) {
            setTab("library");
            setSelected(match);
        } else {
            setTab("upload");
            setUploadTitle(clip.title ?? "");
            setUploadType((clip.type as ClipType) ?? "piano");
        }

        setClipType((clip.type as ClipType) ?? "recording");
        // Runs once the library has arrived, and only for an edit.
    }, [isEdit, samples, state]);

    const visibleSamples = useMemo(
        () =>
            search
                ? samples.filter((sample) =>
                      sample.title.toLowerCase().includes(search.toLowerCase()),
                  )
                : samples,
        [samples, search],
    );

    const canSubmit = tab === "library" ? selected !== null : uploadTitle.trim().length > 0;

    const buildAttrs = () => {
        if (tab === "library" && selected) {
            return {
                title: selected.title,
                type: clipType,
                duration: selected.duration,
                audio_file_id: selected.audioFileId,
            };
        }

        return { title: uploadTitle.trim(), type: uploadType, duration: DEFAULT_DURATION_MS };
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSaving(true);

        try {
            const attrs = buildAttrs();

            if (isEdit) {
                const clip = await updateClip(state.projectId, state.trackId, state.clip.id, attrs);
                onSuccess(state.trackId, clip, true);
            } else {
                const clip = await createClip(state.projectId, state.trackId, {
                    ...attrs,
                    start_time: state.startTime,
                    row_index: 0,
                });
                broadcast(RealtimeEvents.CLIP_CREATED, {
                    session_id: sessionId,
                    track_id: state.trackId,
                    clip,
                });
                onSuccess(state.trackId, clip, false);
            }
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isEdit,
        tab,
        setTab,
        clipType,
        setClipType,
        search,
        setSearch,
        selected,
        setSelected,
        uploadTitle,
        setUploadTitle,
        uploadType,
        setUploadType,
        isSaving,
        canSubmit,
        visibleSamples,
        handleSubmit,
    };
}
