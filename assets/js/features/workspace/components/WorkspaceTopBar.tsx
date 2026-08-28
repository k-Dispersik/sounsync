import { ReactNode, useState } from "react";
import { Share2, Download, ChevronDown, Plus } from "lucide-react";
import { Logo } from "@/shared/components/Logo";
import { useProjectBPM } from "@/features/workspace/hooks/useProjectBPM";
import type { ProjectSettings } from "@/shared/types";
import { TIME_SIGNATURES, type TimeSignatureValue } from "@/shared/types";
import Transport from "./Transport";
import { useRealtime } from "../contextProviders/RealtimeProvider";
import { useTransportContext } from "../contextProviders/TransportProvider";
import { initials, participantColor } from "../model/presence";
import UserSettings from "@/shared/components/UserSettings";
import { RealtimeEvents } from "../events/events";
import { useWorkspaceEvent } from "../hooks/useWorkspaceEvent";
import { getOrCreateSessionId } from "../services/signaling/workspaceChannel";

interface Props {
    projectTitle?: string;
    projectSettings?: ProjectSettings | null;
    onChangeProjectSettings?: (settings: ProjectSettings) => Promise<void>;
    isLoading: boolean;
}

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
    bpm: 120,
    time_signature: "4/4",
    timeline_length_ms: 60_000,
};

function isTimeSignatureValue(value: string): value is TimeSignatureValue {
    return TIME_SIGNATURES.includes(value as TimeSignatureValue);
}

export default function WorkspaceTopBar({
    projectTitle,
    projectSettings,
    onChangeProjectSettings,
    isLoading,
}: Props) {
    const settings = projectSettings ?? DEFAULT_PROJECT_SETTINGS;
    const { playheadPosition } = useTransportContext();

    const playheadTime =
        playheadPosition !== undefined
            ? new Date(playheadPosition).toISOString().slice(11, 23)
            : "00:00:00.000";

    const { broadcast } = useRealtime();

    const handleupdateProjectSettings = async (newSettings: ProjectSettings) => {
        onChangeProjectSettings?.(newSettings);
        broadcast(RealtimeEvents.PROJECT_SETTINGS_UPDATED, {
            session_id: getOrCreateSessionId(),
            settings: newSettings,
        });
    };

    useWorkspaceEvent<{ session_id: string; settings: ProjectSettings }>(
        RealtimeEvents.PROJECT_SETTINGS_UPDATED,
        ({ settings }) => {
            onChangeProjectSettings?.(settings);
        },
    );

    return (
        <header className="flex items-center gap-4 px-4 h-14 bg-base-200 border-b border-base-content/[0.07] flex-shrink-0 relative z-50">
            <Logo size={16} showText={true} />
            <div className="flex items-center gap-1 text-sm text-base-content/60 cursor-pointer hover:text-base-content transition-colors">
                {isLoading ? (
                    <div className="skeleton h-4 w-24 rounded" />
                ) : (
                    <span>{projectTitle ?? "Untitled Project"}</span>
                )}
                <ChevronDown size={14} />
                <span className="ml-2 text-xs text-base-content/30">Saved</span>
            </div>

            {/* Transport */}
            <div className="flex items-center gap-1 mx-auto">
                <Transport />
            </div>

            <div className="flex items-center gap-3 mr-4">
                <TimeSignatureDropdown settings={settings} onChange={handleupdateProjectSettings} />
                <BPMInput settings={settings} onChange={handleupdateProjectSettings} />
                <input className="field w-32" disabled value={playheadTime} />
            </div>

            <CollaboratorAvatars />
            <ExternalActions />
        </header>
    );
}

function TimeSignatureDropdown({
    settings,
    onChange,
}: {
    settings: ProjectSettings;
    onChange?: (settings: ProjectSettings) => Promise<void>;
}) {
    const [isSaving, setIsSaving] = useState(false);

    const handleTimeSignatureChange = async (timeSignature: TimeSignatureValue) => {
        if (!onChange || settings.time_signature === timeSignature) {
            return;
        }

        setIsSaving(true);

        try {
            await onChange({ ...settings, time_signature: timeSignature });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="dropdown cursor-pointer">
            <div
                tabIndex={0}
                role="button"
                className="field flex items-center gap-2 cursor-pointer"
            >
                <span className="field-label">Time Signature</span>
                <span className="font-mono font-semibold">
                    {isSaving ? "..." : settings.time_signature}
                </span>
                <ChevronDown size={14} />
            </div>
            <ul
                tabIndex={-1}
                className="dropdown-content menu bg-base-200 border border-base-content/10 rounded-lg z-40 w-24 p-2 shadow-lg"
            >
                {TIME_SIGNATURES.map((value) => {
                    if (!isTimeSignatureValue(value)) {
                        return null;
                    }

                    return (
                        <li key={value}>
                            <button
                                onClick={() => void handleTimeSignatureChange(value)}
                                className="flex justify-between"
                                disabled={isSaving}
                            >
                                {value}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function BPMInput({
    settings,
    onChange,
}: {
    settings: ProjectSettings;
    onChange?: (settings: ProjectSettings) => Promise<void>;
}) {
    const { draftBPM, isOpen, isSaving, open, commit, setDraftBPM, keyDown } = useProjectBPM({
        settings,
        onChange,
    });

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
                        onKeyDown={(event) => keyDown(event)}
                        min={20}
                        max={300}
                        disabled={isSaving}
                    />
                </label>
            ) : (
                <button type="button" className="field flex items-center gap-2" onClick={open}>
                    <span className="text-white/40 text-xs">BPM</span>
                    <span className="font-mono font-semibold">
                        {isSaving ? "..." : settings.bpm}
                    </span>
                </button>
            )}
        </>
    );
}

/**
 * Who is actually in the project right now, from presence.
 *
 * The colour comes from the server so one person looks the same to everyone,
 * and a person with two tabs open still gets one face.
 */
function CollaboratorAvatars() {
    const { participants } = useRealtime();

    return (
        <div className="flex items-center gap-1">
            {participants.map((participant) => (
                <div
                    key={participant.userId}
                    title={
                        participant.sessions > 1
                            ? `${participant.name} (${participant.sessions} tabs)`
                            : participant.name
                    }
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-base-100 flex-shrink-0 ring-2 ring-base-200 -ml-1 first:ml-0"
                    style={{ backgroundColor: participantColor(participant.colorHue) }}
                >
                    {initials(participant.name)}
                </div>
            ))}
            <button
                aria-label="Invite someone to this project"
                className="w-7 h-7 rounded-full bg-base-content/10 hover:bg-base-content/20 flex items-center justify-center text-base-content/60 transition-colors ml-1"
            >
                <Plus size={13} />
            </button>
        </div>
    );
}

function ExternalActions() {
    return (
        <div className="flex items-center gap-2 ml-2">
            <button className="flex items-center gap-2 px-3 h-8 rounded-md bg-base-content/[0.06] hover:bg-base-content/[0.10] border border-base-content/10 text-sm text-base-content/70 transition-colors">
                <Share2 size={13} />
                Share
            </button>
            <button className="flex items-center gap-2 px-3 h-8 rounded-md bg-primary hover:opacity-90 text-sm text-primary-content font-medium transition-opacity">
                <Download size={13} />
                Export
            </button>
            <UserSettings />
        </div>
    );
}
