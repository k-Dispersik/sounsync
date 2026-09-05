import { Clock, Music2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { formatDuration } from "@/shared/lib/duration";
import type { AudioFile } from "@/shared/types";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { useAudioFiles } from "../hooks/useAudioFiles";
import UploadTab from "./UploadTab";

const STATUS_LABEL: Record<AudioFile["status"], string> = {
    pending: "processing…",
    ready: "",
    failed: "could not be read",
};

function SidebarTab({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
    return (
        <button
            className={`flex-1 flex items-center justify-center h-10 border-b-2 transition-colors ${
                active
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content/30 hover:text-base-content/60"
            }`}
        >
            {icon}
        </button>
    );
}

function SampleRow({ file }: { file: AudioFile }) {
    const detail = STATUS_LABEL[file.status] || formatDuration(file.duration_ms);

    return (
        <li className="flex items-center gap-3 px-3 py-2 hover:bg-base-content/[0.04] transition-colors">
            <span className="text-base leading-none">🎵</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-base-content/75 truncate">{file.original_filename}</p>
                <p className="text-[11px] text-base-content/30">{detail}</p>
            </div>
        </li>
    );
}

export default function SampleSidebar({ projectId }: { projectId: number }) {
    const { files, isLoading, isError, refresh } = useAudioFiles(projectId);
    const [search, setSearch] = useState("");

    const visible = useMemo(
        () =>
            search
                ? files.filter((file) =>
                      file.original_filename.toLowerCase().includes(search.toLowerCase()),
                  )
                : files,
        [files, search],
    );

    return (
        <aside className="w-52 flex-shrink-0 bg-base-200 border-r border-base-content/[0.07] flex flex-col">
            <div className="flex border-b border-base-content/[0.07]">
                <SidebarTab icon={<Music2 size={14} />} active />
                <SidebarTab icon={<Clock size={14} />} />
            </div>

            <div className="p-3 border-b border-base-content/[0.07]">
                <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-base-content/[0.05] border border-base-content/[0.08]">
                    <Search size={13} className="text-base-content/30 flex-shrink-0" />
                    <label htmlFor="sample-search" className="sr-only">
                        Search samples
                    </label>
                    <input
                        id="sample-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="bg-transparent text-sm text-base-content/70 placeholder:text-base-content/25 outline-none w-full"
                        placeholder="Search samples…"
                    />
                </div>

                <div className="mt-2">
                    <UploadTab projectId={projectId} onUploaded={refresh} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
                <SampleList
                    files={files}
                    visible={visible}
                    isLoading={isLoading}
                    isError={isError}
                    onRetry={refresh}
                />
            </div>
        </aside>
    );
}

/**
 * The library itself: loading, failed, empty, or a list.
 *
 * "Empty" here has two meanings — no samples at all, and none matching the
 * search — and they call for different words: one asks for an upload, the
 * other for a different search.
 */
function SampleList({
    files,
    visible,
    isLoading,
    isError,
    onRetry,
}: {
    files: AudioFile[];
    visible: AudioFile[];
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
}) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-10 w-full" count={4} />
            </div>
        );
    }

    if (isError) {
        return <ErrorState title="The sample library could not be loaded." onRetry={onRetry} />;
    }

    if (visible.length === 0) {
        return files.length === 0 ? (
            <EmptyState title="No samples yet" description="Upload one to get started." />
        ) : (
            <EmptyState title="Nothing matches that search." />
        );
    }

    return (
        <ul>
            {visible.map((file) => (
                <SampleRow key={file.id} file={file} />
            ))}
        </ul>
    );
}
