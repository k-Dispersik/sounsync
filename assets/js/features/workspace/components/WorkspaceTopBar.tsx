import React from "react";
import {
    SkipBack,
    Square,
    Play,
    Circle,
    SkipForward,
    Repeat2,
    Share2,
    Download,
    Settings,
    ChevronDown,
    Plus
} from "lucide-react";
import { Logo } from "js/shared/components/Logo";
import { useProjectBPM } from "js/features/workspace/hooks/useProjectBPM";
import type { ProjectSettings } from "../../../shared/types";

const AVATARS = [
    { initials: "A", color: "#6366f1" },
    { initials: "M", color: "#ec4899" },
    { initials: "J", color: "#06b6d4" },
];

function TransportBtn({ children }: { children: React.ReactNode }) {
    return (
        <button className="w-9 h-9 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white transition-colors">
            {children}
        </button>
    );
}

interface Props {
    projectTitle?: string;
    projectSettings?: ProjectSettings | null;
    onBPMChange?: (BPM: number) => Promise<void>;
    isLoading: boolean;
}

export default function WorkspaceTopBar({ projectTitle, projectSettings, onBPMChange, isLoading }: Props) {
    return (
        <header className="flex items-center gap-4 px-4 h-14 bg-[#0d1117] border-b border-white/[0.07] flex-shrink-0 z-20">
            <Logo size={16} showText={true} />
            <div className="flex items-center gap-1 text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                {isLoading ? (
                    <div className="skeleton h-4 w-24 rounded" />
                ) : (
                    <span>{projectTitle ?? "Untitled Project"}</span>
                )}
                <ChevronDown size={14} />
                <span className="ml-2 text-xs text-white/30">Saved</span>
            </div>

            {/* Transport */}
            <div className="flex items-center gap-1 mx-auto">
                <TransportBtn><SkipBack size={15} /></TransportBtn>
                <TransportBtn><Square size={15} /></TransportBtn>
                <button className="w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center transition-colors">
                    <Play size={16} className="text-white ml-0.5" />
                </button>
                <TransportBtn><Circle size={15} className="text-red-400" /></TransportBtn>
                <TransportBtn><SkipForward size={15} /></TransportBtn>
                <TransportBtn><Repeat2 size={15} /></TransportBtn>
            </div>

            <div className="flex items-center gap-3 mr-4">
                <BPMInput BPM={projectSettings?.BPM} onChange={onBPMChange} />
                <input className="field w-32" disabled value={"00:00:00.000"} />
            </div>

            <CollaboratorAvatars users={AVATARS} />
            <ExternalActions />
        </header>
    );
}



function BPMInput({ BPM = 120, onChange }: { BPM?: number; onChange?: (BPM: number) => Promise<void> }) {
    const { draftBPM, isOpen, isSaving, open, close, commit, setDraftBPM } = useProjectBPM({ BPM, onChange });

    return (
        <>
            {isOpen ? (
                <label className="field-shell">
                    <span className="field-label">BPM</span>
                    <input
                        type="number"
                        className="field w-12"
                        value={draftBPM}
                        autoFocus
                        onChange={(event) => setDraftBPM(event.target.value)}
                        onBlur={commit}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                void commit();
                            }

                            if (event.key === "Escape") {
                                close();
                            }
                        }}
                        min={20}
                        max={300}
                        disabled={isSaving}
                    />
                </label>
            ) : (
                <button
                    type="button"
                    className="field flex items-center gap-2"
                    onClick={open}>
                    <span className="text-white/40 text-xs">BPM</span>
                    <span className="font-mono font-semibold">{isSaving ? "..." : BPM}</span>
                </button>
            )
            }
        </>
    );

}

function CollaboratorAvatars({ users }: { users?: { initials: string; color: string }[] }) {
    return (
        <div className="flex items-center gap-1">
            {users?.map((a) => (
                <div
                    key={a.initials}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ring-2 ring-[#0d1117] -ml-1 first:ml-0"
                    style={{ backgroundColor: a.color }}
                >
                    {a.initials}
                </div>
            ))}
            <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors ml-1">
                <Plus size={13} />
            </button>
        </div>
    );
}

function ExternalActions() {
    return (
        <div className="flex items-center gap-2 ml-2">
            <button className="flex items-center gap-2 px-3 h-8 rounded-md bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-sm text-white/70 transition-colors">
                <Share2 size={13} />
                Share
            </button>
            <button className="flex items-center gap-2 px-3 h-8 rounded-md bg-indigo-500 hover:bg-indigo-400 text-sm text-white font-medium transition-colors">
                <Download size={13} />
                Export
            </button>
            <button className="w-8 h-8 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
                <Settings size={15} />
            </button>
        </div>
    );
}