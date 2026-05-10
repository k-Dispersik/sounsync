import React from "react";
import { Search, Upload, Music2, Clock } from "lucide-react";
import useSampleSidebar from "../hooks/useSampleSidebar";
import type { Track } from "../../../shared/types/index";
import { useClipModal } from "../contextProviders/ClipModalProvider";

const CAT_ICONS: Record<string, string> = {
    drums: "🥁",
    bass: "🎵",
    piano: "🎹",
    guitar: "🎸",
    recording: "🎤",
    effect: "✨",
};

function SidebarTab({
    icon,
    active = false,
}: {
    icon: React.ReactNode;
    active?: boolean;
}) {
    return (
        <button
            className={`flex-1 flex items-center justify-center h-10 border-b-2 transition-colors ${active
                ? "border-primary text-primary"
                : "border-transparent text-base-content/30 hover:text-base-content/60"
                }`}
        >
            {icon}
        </button>
    );
}

export default function SampleSidebar({ projectId, tracks, isLoading }: { projectId: number; tracks?: Track[]; isLoading?: boolean }) {
    const samples = useSampleSidebar(tracks ?? []);
    const { openEditClip } = useClipModal();

    return (
        <aside className="w-52 flex-shrink-0 bg-base-200 border-r border-base-content/[0.07] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-base-content/[0.07]">
                <SidebarTab icon={<Music2 size={14} />} active />
                <SidebarTab icon={<Clock size={14} />} />
            </div>

            {/* Search */}
            <div className="p-3 border-b border-base-content/[0.07]">
                <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-base-content/[0.05] border border-base-content/[0.08]">
                    <Search size={13} className="text-base-content/30 flex-shrink-0" />
                    <input
                        className="bg-transparent text-sm text-base-content/70 placeholder:text-base-content/25 outline-none w-full"
                        placeholder="Search samples…"
                    />
                </div>
                <button className="mt-2 w-full flex items-center justify-center gap-2 h-8 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium transition-colors">
                    <Upload size={12} />
                    Upload Sample
                </button>
            </div>

            {/* Sample list */}
            <div className="flex-1 overflow-y-auto py-1">

                {isLoading ? (
                    <div className="p-4 flex flex-col gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="skeleton h-10 w-full rounded" />
                        ))}
                    </div>
                ) : (

                    samples.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => openEditClip(s.project_id, s.track_id!, s)}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-base-content/[0.04] group transition-colors"
                        >
                            <span className="text-base leading-none">{CAT_ICONS[s.type] ?? "🎵"}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-base-content/75 truncate group-hover:text-base-content transition-colors">
                                    {s.title}
                                </p>
                                <p className="text-[11px] text-base-content/30">
                                    {s.type} · {s.duration}s
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
