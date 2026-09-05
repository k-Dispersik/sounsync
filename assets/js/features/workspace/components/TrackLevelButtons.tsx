import { useTransportContext } from "../contextProviders/TransportProvider";

/**
 * Mute and solo for one track.
 *
 * Solo reads as "only this", so its pressed state is worth showing on every
 * track: when something is soloed, the tracks that fell silent should look
 * silenced rather than broken.
 */
export default function TrackLevelButtons({ trackId }: { trackId: number }) {
    const { trackMix, toggleTrackMute, toggleTrackSolo } = useTransportContext();
    const mix = trackMix(trackId);

    return (
        <div className="flex items-center gap-1">
            <LevelButton
                label={`${mix.muted ? "Unmute" : "Mute"} track`}
                letter="M"
                active={mix.muted}
                onClick={() => toggleTrackMute(trackId)}
            />
            <LevelButton
                label={`${mix.soloed ? "Unsolo" : "Solo"} track`}
                letter="S"
                active={mix.soloed}
                onClick={() => toggleTrackSolo(trackId)}
            />
        </div>
    );
}

function LevelButton({
    label,
    letter,
    active,
    onClick,
}: {
    label: string;
    letter: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className={`w-5 h-5 rounded text-[10px] font-bold transition-colors ${
                active
                    ? "bg-primary text-primary-content"
                    : "bg-base-content/[0.08] text-subtle hover:text-base-content/70"
            }`}
        >
            {letter}
        </button>
    );
}
