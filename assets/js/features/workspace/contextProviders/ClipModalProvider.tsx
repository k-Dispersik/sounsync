import { createContext, use, useCallback, useMemo, useState } from "react";

import ClipModal from "@/features/workspace/components/ClipModal";
import type { Clip } from "@/shared/types";

export type ClipModalState =
    | { kind: "create"; projectId: number; trackId: number; startTime: number }
    | { kind: "edit"; projectId: number; trackId: number; clip: Clip }
    | null;

interface ClipModalContextValue {
    openCreateClip: (projectId: number, trackId: number, startTime: number) => void;
    openEditClip: (projectId: number, trackId: number, clip: Clip) => void;
}

const ClipModalContext = createContext<ClipModalContextValue | null>(null);

export function useClipModal(): ClipModalContextValue {
    const context = use(ClipModalContext);

    if (!context) throw new Error("useClipModal must be used inside ClipModalProvider");

    return context;
}

/**
 * Owns the clip dialog. Saving a clip is an operation now, so the dialog only
 * has to close: the new clip reaches the timeline the same way a peer's would.
 */
export default function ClipModalProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ClipModalState>(null);

    const openCreateClip = useCallback(
        (projectId: number, trackId: number, startTime: number) =>
            setState({ kind: "create", projectId, trackId, startTime }),
        [],
    );

    const openEditClip = useCallback(
        (projectId: number, trackId: number, clip: Clip) =>
            setState({ kind: "edit", projectId, trackId, clip }),
        [],
    );

    const close = useCallback(() => setState(null), []);

    const value = useMemo(() => ({ openCreateClip, openEditClip }), [openCreateClip, openEditClip]);

    return (
        <ClipModalContext value={value}>
            {children}
            {state && <ClipModal state={state} onClose={close} />}
        </ClipModalContext>
    );
}
