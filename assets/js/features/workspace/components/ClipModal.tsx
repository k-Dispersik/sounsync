import { useEffect, useRef } from "react";
import { X, Music2, Upload, Check, Search } from "lucide-react";
import type { ClipModalState } from "../contextProviders/ClipModalProvider";
import {
    useClipForm,
    TYPE_META,
    CLIP_TYPES,
    type Tab,
    type ClipType,
    type LibrarySample,
    type ClipSuccessCallback,
} from "../hooks/useClipForm";

interface Props {
    state: NonNullable<ClipModalState>;
    onClose: () => void;
    onSuccess: ClipSuccessCallback;
}

export default function ClipModal({ state, onClose, onSuccess }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const form = useClipForm(state, onSuccess);

    useEffect(() => {
        dialogRef.current?.showModal();
        return () => dialogRef.current?.close();
    }, []);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) onClose();
    };

    return (
        <dialog ref={dialogRef} className="modal" onClick={handleBackdropClick}>
            <div className="modal-box max-w-xl p-0 overflow-hidden bg-base-200 border border-base-content/[0.08] rounded-2xl shadow-2xl">
                <ModalHeader isEdit={form.isEdit} onClose={onClose} />
                <TabBar tab={form.tab} onChange={form.setTab} />

                <div className="p-5">
                    {form.tab === "library" && (
                        <LibraryTab
                            search={form.search}
                            onSearchChange={form.setSearch}
                            typeFilter={form.typeFilter}
                            onTypeFilterChange={form.setTypeFilter}
                            samples={form.visibleSamples}
                            selected={form.selected}
                            onSelect={form.setSelected}
                        />
                    )}
                    {form.tab === "upload" && (
                        <UploadTab
                            title={form.uploadTitle}
                            onTitleChange={form.setUploadTitle}
                            type={form.uploadType}
                            onTypeChange={form.setUploadType}
                        />
                    )}
                </div>

                <ModalFooter
                    isEdit={form.isEdit}
                    isSaving={form.isSaving}
                    canSubmit={form.canSubmit}
                    onClose={onClose}
                    onSubmit={form.handleSubmit}
                />
            </div>
        </dialog>
    );
}

function ModalHeader({ isEdit, onClose }: { isEdit: boolean; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-base-content/[0.07]">
            <h3 className="text-base font-semibold text-base-content">
                {isEdit ? "Edit Clip" : "Add Clip"}
            </h3>
            <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-base-content/40 hover:text-base-content hover:bg-base-content/[0.07] transition-colors"
            >
                <X size={15} />
            </button>
        </div>
    );
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "library", label: "Sound Library", icon: <Music2 size={13} /> },
        { key: "upload", label: "Upload File", icon: <Upload size={13} /> },
    ];

    return (
        <div className="flex border-b border-base-content/[0.07]">
            {tabs.map(({ key, label, icon }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        tab === key
                            ? "border-primary text-primary"
                            : "border-transparent text-base-content/40 hover:text-base-content/70"
                    }`}
                >
                    {icon}
                    {label}
                </button>
            ))}
        </div>
    );
}

function LibraryTab({
    search,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    samples,
    selected,
    onSelect,
}: {
    search: string;
    onSearchChange: (v: string) => void;
    typeFilter: ClipType | "all";
    onTypeFilterChange: (v: ClipType | "all") => void;
    samples: LibrarySample[];
    selected: LibrarySample | null;
    onSelect: (s: LibrarySample) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <SearchBar value={search} onChange={onSearchChange} />

            <div className="flex flex-wrap gap-1.5">
                <FilterPill
                    label="All"
                    active={typeFilter === "all"}
                    onClick={() => onTypeFilterChange("all")}
                />
                {CLIP_TYPES.map((t) => (
                    <FilterPill
                        key={t}
                        label={`${TYPE_META[t].icon} ${TYPE_META[t].label}`}
                        active={typeFilter === t}
                        onClick={() => onTypeFilterChange(t)}
                    />
                ))}
            </div>

            <SampleList samples={samples} selected={selected} onSelect={onSelect} />
        </div>
    );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2 px-3 h-8 rounded-lg bg-base-content/[0.05] border border-base-content/[0.08]">
            <Search size={13} className="text-base-content/30 flex-shrink-0" />
            <input
                className="bg-transparent text-sm text-base-content/80 placeholder:text-base-content/25 outline-none w-full"
                placeholder="Search sounds…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function SampleList({
    samples,
    selected,
    onSelect,
}: {
    samples: LibrarySample[];
    selected: LibrarySample | null;
    onSelect: (s: LibrarySample) => void;
}) {
    return (
        <div className="h-52 overflow-y-auto rounded-xl border border-base-content/[0.07] bg-base-100/50 divide-y divide-base-content/[0.05]">
            {samples.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-base-content/30">
                    No sounds found
                </div>
            )}
            {samples.map((s) => (
                <SampleRow
                    key={s.id}
                    sample={s}
                    isActive={selected?.id === s.id}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

function SampleRow({
    sample,
    isActive,
    onSelect,
}: {
    sample: LibrarySample;
    isActive: boolean;
    onSelect: (s: LibrarySample) => void;
}) {
    const meta = TYPE_META[sample.type];
    const duration = `${(sample.duration / 1000).toFixed(1)}s`;

    return (
        <button
            type="button"
            onClick={() => onSelect(sample)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                isActive ? "bg-primary/10" : "hover:bg-base-content/[0.03]"
            }`}
        >
            <span className="text-base leading-none w-5 text-center">{meta.icon}</span>
            <div className="flex-1 min-w-0">
                <p
                    className={`text-sm truncate ${isActive ? "text-primary font-medium" : "text-base-content/75"}`}
                >
                    {sample.title}
                </p>
                <p className="text-[11px] text-base-content/30">
                    {meta.label} · {duration}
                </p>
            </div>
            {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
        </button>
    );
}

function UploadTab({
    title,
    onTitleChange,
    type,
    onTypeChange,
}: {
    title: string;
    onTitleChange: (v: string) => void;
    type: ClipType;
    onTypeChange: (v: ClipType) => void;
}) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-base-content/50 uppercase tracking-wider">
                    Title
                </label>
                <input
                    className="w-full h-9 px-3 rounded-lg bg-base-content/[0.05] border border-base-content/[0.08] text-sm text-base-content/90 placeholder:text-base-content/25 outline-none focus:border-primary/50 transition-colors"
                    placeholder="My clip…"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-base-content/50 uppercase tracking-wider">
                    Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {CLIP_TYPES.map((t) => (
                        <FilterPill
                            key={t}
                            label={`${TYPE_META[t].icon} ${TYPE_META[t].label}`}
                            active={type === t}
                            onClick={() => onTypeChange(t)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed border-base-content/[0.12] hover:border-primary/40 hover:bg-primary/[0.03] transition-colors cursor-pointer">
                <Upload size={20} className="text-base-content/25" />
                <p className="text-sm text-base-content/40">
                    Drop audio file or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-[11px] text-base-content/25">MP3, WAV, FLAC</p>
            </div>
        </div>
    );
}

function ModalFooter({
    isEdit,
    isSaving,
    canSubmit,
    onClose,
    onSubmit,
}: {
    isEdit: boolean;
    isSaving: boolean;
    canSubmit: boolean;
    onClose: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <button
                onClick={onClose}
                className="h-8 px-4 rounded-lg text-sm text-base-content/50 hover:text-base-content hover:bg-base-content/[0.07] transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onSubmit}
                disabled={!canSubmit || isSaving}
                className="h-8 px-4 rounded-lg text-sm font-medium bg-primary text-primary-content hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Add to Timeline"}
            </button>
        </div>
    );
}

function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-6 px-2.5 rounded-full text-xs font-medium transition-colors ${
                active
                    ? "bg-primary text-primary-content"
                    : "bg-base-content/[0.06] text-base-content/50 hover:bg-base-content/[0.10] hover:text-base-content/80"
            }`}
        >
            {label}
        </button>
    );
}
