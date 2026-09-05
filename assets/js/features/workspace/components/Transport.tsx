import { Circle, Pause, Play, Repeat2, SkipBack, SkipForward, Square } from "lucide-react";

import { IconButton } from "@/shared/ui";
import { useTransportContext } from "../contextProviders/TransportProvider";

export default function Transport() {
    const { isPlaying, isLoading, play, pause, stop } = useTransportContext();

    return (
        <>
            <IconButton
                label="Rewind to the start (not available yet)"
                icon={<SkipBack size={15} />}
                disabled
            />
            <IconButton label="Stop" icon={<Square size={15} />} onClick={stop} />
            {isPlaying ? (
                <IconButton label="Pause" icon={<Pause size={15} />} onClick={pause} />
            ) : (
                <IconButton
                    label={isLoading ? "Loading samples…" : "Play (space)"}
                    icon={<Play size={16} className="ml-0.5" />}
                    aria-busy={isLoading}
                    disabled={isLoading}
                    onClick={play}
                />
            )}
            <IconButton
                label="Record (not available yet)"
                icon={<Circle size={15} className="text-error" />}
                disabled
            />
            <IconButton
                label="Skip forward (not available yet)"
                icon={<SkipForward size={15} />}
                disabled
            />
            <IconButton label="Loop (not available yet)" icon={<Repeat2 size={15} />} disabled />
        </>
    );
}
