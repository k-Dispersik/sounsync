import { useEffect, useMemo, useState } from "react";
import type { ClipModalState } from "../contextProviders/ClipModalProvider";
import { createClip, updateClip } from "../api/clips";
import { useRealtime } from "../contextProviders/RealtimeProvider";
import { RealtimeEvents } from "../events/events";
import { getOrCreateSessionId } from "../services/signaling/workspaceChannel";

export type ClipType = "piano" | "guitar" | "drums" | "bass" | "recording" | "effect";
export type Tab = "library" | "upload";

export interface LibrarySample {
    id: string;
    title: string;
    type: ClipType;
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

const LIBRARY: LibrarySample[] = [
    { id: "p1", title: "Grand Piano C Major", type: "piano", duration: 4200 },
    { id: "p2", title: "Jazz Piano Voicing", type: "piano", duration: 2800 },
    { id: "p3", title: "Soft Keys Pad", type: "piano", duration: 6100 },
    { id: "g1", title: "Acoustic Strum D", type: "guitar", duration: 3500 },
    { id: "g2", title: "Electric Blues Riff", type: "guitar", duration: 5100 },
    { id: "d1", title: "Kick + Snare Loop", type: "drums", duration: 2000 },
    { id: "d2", title: "Hi-Hat Groove", type: "drums", duration: 2000 },
    { id: "d3", title: "Full Kit Loop", type: "drums", duration: 4000 },
    { id: "b1", title: "Funk Bass Line", type: "bass", duration: 4000 },
    { id: "b2", title: "Walking Bass", type: "bass", duration: 3200 },
    { id: "r1", title: "Vocal Take A", type: "recording", duration: 8000 },
    { id: "r2", title: "Backing Vocal Layer", type: "recording", duration: 5500 },
    { id: "e1", title: "Reverb Sweep", type: "effect", duration: 3000 },
    { id: "e2", title: "Vinyl Crackle", type: "effect", duration: 4000 },
];

import type { Clip } from "js/shared/types";

export type ClipSuccessCallback = (trackId: number, clip: Clip, isEdit: boolean) => void;

export function useClipForm(state: NonNullable<ClipModalState>, onSuccess: ClipSuccessCallback) {
    const { broadcast } = useRealtime();
    const sessionId = getOrCreateSessionId();
    const isEdit = state.kind === "edit";

    const [tab, setTab] = useState<Tab>("library");
    const [typeFilter, setTypeFilter] = useState<ClipType | "all">("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<LibrarySample | null>(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadType, setUploadType] = useState<ClipType>("piano");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isEdit) return;

        const clip = state.clip;
        const match = LIBRARY.find(s => s.title === clip.title && s.type === clip.type);

        if (match) {
            setTab("library");
            setSelected(match);
            setTypeFilter(match.type);
        } else {
            setTab("upload");
            setUploadTitle(clip.title ?? "");
            setUploadType((clip.type as ClipType) ?? "piano");
        }
    }, []);

    const visibleSamples = useMemo(
        () => LIBRARY.filter(s => {
            const matchType = typeFilter === "all" || s.type === typeFilter;
            const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
            return matchType && matchSearch;
        }),
        [typeFilter, search]
    );

    const canSubmit = tab === "library"
        ? selected !== null
        : uploadTitle.trim().length > 0;

    const buildAttrs = () => {
        if (tab === "library" && selected) {
            return { title: selected.title, type: selected.type, duration: selected.duration };
        }
        return { title: uploadTitle.trim(), type: uploadType, duration: 4000 };
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
        tab, setTab,
        typeFilter, setTypeFilter,
        search, setSearch,
        selected, setSelected,
        uploadTitle, setUploadTitle,
        uploadType, setUploadType,
        isSaving,
        canSubmit,
        visibleSamples,
        handleSubmit,
    };
}
