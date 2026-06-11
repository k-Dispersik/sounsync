import { createContext, useContext, useState } from "react";
import type { Clip } from "js/shared/types";
import type { ClipSuccessCallback } from "js/features/workspace/hooks/useClipForm";
import ClipModal from "js/features/workspace/components/ClipModal";

export type ClipModalState =
    | { kind: "create"; projectId: number; trackId: number; startTime: number }
    | { kind: "edit"; projectId: number; trackId: number; clip: Clip }
    | null;

interface ClipModalContextValue {
    openCreateClip: (projectId: number, trackId: number, startTime: number) => void;
    openEditClip: (projectId: number, trackId: number, clip: Clip) => void;
}

const ClipModalContext = createContext<ClipModalContextValue | null>(null);

export function useClipModal() {
    const ctx = useContext(ClipModalContext);
    if (!ctx) throw new Error("useClipModal must be used inside ClipModalProvider");
    return ctx;
}

interface Props {
    children: React.ReactNode;
    onSuccess: ClipSuccessCallback;
}

export default function ClipModalProvider({ children, onSuccess }: Props) {
    const [state, setState] = useState<ClipModalState>(null);

    const openCreateClip = (projectId: number, trackId: number, startTime: number) =>
        setState({ kind: "create", projectId, trackId, startTime });

    const openEditClip = (projectId: number, trackId: number, clip: Clip) =>
        setState({ kind: "edit", projectId, trackId, clip });

    const handleClose = () => setState(null);

    const handleSuccess: ClipSuccessCallback = (trackId, clip, isEdit) => {
        setState(null);
        onSuccess(trackId, clip, isEdit);
    };

    return (
        <ClipModalContext.Provider value={{ openCreateClip, openEditClip }}>
            {children}
            {state && <ClipModal state={state} onClose={handleClose} onSuccess={handleSuccess} />}
        </ClipModalContext.Provider>
    );
}
