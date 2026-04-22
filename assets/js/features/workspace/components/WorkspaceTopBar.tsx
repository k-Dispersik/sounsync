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
    Plus,
    Music2,
} from "lucide-react";

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
    isLoading: boolean;
}

export default function WorkspaceTopBar({ projectTitle, isLoading }: Props) {
    return (
        <header className="flex items-center gap-4 px-4 h-14 bg-[#0d1117] border-b border-white/[0.07] flex-shrink-0 z-20">
            {/* Logo + project */}
            <div className="flex items-center gap-3 w-52 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Music2 size={16} className="text-white" />
                </div>
                <span className="font-semibold text-white text-sm">SoundSync</span>
            </div>

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

            {/* BPM + time */}
            <div className="flex items-center gap-3 mr-4">
                <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-white/[0.06] border border-white/10 text-sm text-white/80">
                    <span className="text-white/40 text-xs">BPM</span>
                    <span className="font-mono font-semibold">120</span>
                </div>
                <div className="px-3 h-8 rounded-md bg-white/[0.06] border border-white/10 font-mono text-sm text-white/80 flex items-center">
                    00:00:00.000
                </div>
            </div>

            {/* Collaborators */}
            <div className="flex items-center gap-1">
                {AVATARS.map((a) => (
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

            {/* Actions */}
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
        </header>
    );
}
