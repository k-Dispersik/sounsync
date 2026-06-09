import { createContext, useContext, useMemo, useState } from "react";
import { Player } from "../services/audio/Player";
import { Scheduler } from "../services/audio/Sheduler";
import { AudioEngine } from "../services/audio/AudioEngine";
import { SampleBank } from "../services/audio/SampleBank";

type TransportContextType = {
    isPlaying: boolean;
    playheadPosition: number;
    play: () => void;
    pause: () => void;
    stop: () => void;
    setPosition: (ms: number) => void;
};

const TransportContext = createContext<TransportContextType | null>(null);

export default function TransportProvider({ children }: { children: React.ReactNode }) {
    const scheduler = useMemo(() => new Scheduler(), []);

    const engine = useMemo(() => {
        const ctx = new AudioContext();
        return new AudioEngine(ctx, new SampleBank(ctx));
    }, []);

    const player = useMemo(() => {
        return new Player(scheduler, engine);
    }, [scheduler, engine]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [playheadPosition, setPlayheadPosition] = useState(0);

    const transport = useMemo(() => {
        return {
            isPlaying,
            playheadPosition,

            play: () => {
                setIsPlaying(true);
                player.start();
            },

            pause: () => {
                setIsPlaying(false);
                player.pause();
            },

            stop: () => {
                setIsPlaying(false);
                setPlayheadPosition(0);
                player.stop();
            },

            setPosition: (ms: number) => {
                setPlayheadPosition(ms);
                player.seek(ms);
            },
        };
    }, [player, isPlaying, playheadPosition]);

    return (
        <TransportContext.Provider value={transport}>
            {children}
        </TransportContext.Provider>
    );
}

export function useTransportContext() {
    const ctx = useContext(TransportContext);
    if (!ctx) {
        throw new Error("useTransport must be used within TransportProvider");
    }
    return ctx;
}