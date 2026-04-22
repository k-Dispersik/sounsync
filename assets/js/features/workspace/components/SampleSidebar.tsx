import React from "react";
import { Search, Upload, Music2, Clock, Users } from "lucide-react";
import useSampleSidebar from "../hooks/useSampleSidebar";

const CAT_ICONS: Record<string, string> = {
    drums: "🥁",
    bass: "🎸",
    synth: "🎹",
    vocals: "🎤",
    fx: "✨",
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
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-white/30 hover:text-white/60"
                }`}
        >
            {icon}
        </button>
    );
}

export default function SampleSidebar({ tracks }: { tracks?: any[] }) {
    // Get samples based on current project tracks 
    const samples = useSampleSidebar(tracks ?? []);

    return (
        <aside className="w-52 flex-shrink-0 bg-[#0d1117] border-r border-white/[0.07] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.07]">
                <SidebarTab icon={<Music2 size={14} />} active />
                <SidebarTab icon={<Clock size={14} />} />
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-white/[0.05] border border-white/[0.08]">
                    <Search size={13} className="text-white/30 flex-shrink-0" />
                    <input
                        className="bg-transparent text-sm text-white/70 placeholder-white/25 outline-none w-full"
                        placeholder="Search samples…"
                    />
                </div>
                <button className="mt-2 w-full flex items-center justify-center gap-2 h-8 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors">
                    <Upload size={12} />
                    Upload Sample
                </button>
            </div>

            {/* Sample list */}
            <div className="flex-1 overflow-y-auto py-1">
                {samples.map((s) => (
                    <div
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/[0.04] group transition-colors"
                    >
                        <span className="text-base leading-none">{CAT_ICONS[s.cat] ?? "🎵"}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/75 truncate group-hover:text-white transition-colors">
                                {s.name}
                            </p>
                            <p className="text-[11px] text-white/30">
                                {s.cat} · {s.dur}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
