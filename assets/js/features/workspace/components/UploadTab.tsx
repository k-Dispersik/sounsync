import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import type { AudioFile } from "@/shared/types";
import { useUploads, type Upload as UploadState } from "../hooks/useUploads";

const STAGE_LABEL: Record<UploadState["stage"], string> = {
    preparing: "Preparing…",
    sending: "Uploading",
    finishing: "Finishing…",
    done: "Ready",
    failed: "Failed",
    cancelled: "Cancelled",
};

function UploadRow({ upload, onCancel }: { upload: UploadState; onCancel: () => void }) {
    const inFlight = ["preparing", "sending", "finishing"].includes(upload.stage);

    return (
        <li className="px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-base-content/70">{upload.filename}</span>
                <span className="text-base-content/40">{STAGE_LABEL[upload.stage]}</span>
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label={
                        inFlight ? `Cancel ${upload.filename}` : `Dismiss ${upload.filename}`
                    }
                    className="text-base-content/30 hover:text-base-content/70 transition-colors"
                >
                    <X size={12} />
                </button>
            </div>

            {inFlight && (
                <div
                    role="progressbar"
                    aria-valuenow={Math.round(upload.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${upload.filename}`}
                    className="mt-1.5 h-1 rounded bg-base-content/10 overflow-hidden"
                >
                    <div
                        className="h-full bg-primary transition-[width]"
                        style={{ width: `${Math.round(upload.progress * 100)}%` }}
                    />
                </div>
            )}

            {upload.error && (
                <p role="alert" className="mt-1 text-error">
                    {upload.error}
                </p>
            )}
        </li>
    );
}

export default function UploadTab({
    projectId,
    onUploaded,
}: {
    projectId: number;
    onUploaded?: (file: AudioFile) => void;
}) {
    const { uploads, start, cancel, dismiss } = useUploads(projectId, onUploaded);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        start(Array.from(event.dataTransfer.files));
    };

    return (
        <div>
            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`rounded-md border border-dashed transition-colors ${
                    isDragging ? "border-primary bg-primary/10" : "border-base-content/15"
                }`}
            >
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 h-10 text-primary text-xs font-medium"
                >
                    <Upload size={12} />
                    Upload sample
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                multiple
                hidden
                aria-label="Choose audio files to upload"
                onChange={(event) => {
                    start(Array.from(event.target.files ?? []));
                    event.target.value = "";
                }}
            />

            {uploads.length > 0 && (
                <ul className="mt-2 divide-y divide-base-content/[0.07]">
                    {uploads.map((upload) => (
                        <UploadRow
                            key={upload.id}
                            upload={upload}
                            onCancel={() =>
                                upload.stage === "sending" || upload.stage === "preparing"
                                    ? cancel(upload.id)
                                    : dismiss(upload.id)
                            }
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
