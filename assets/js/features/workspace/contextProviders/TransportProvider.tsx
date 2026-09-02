import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { createLogger } from "@/shared/lib/logger";
import { AudioGraph } from "../services/audio/AudioGraph";
import { Player } from "../services/audio/Player";
import { SampleBank } from "../services/audio/SampleBank";
import { Scheduler } from "../services/audio/Scheduler";

const log = createLogger("Transport");

interface TransportContextValue {
    isPlaying: boolean;
    playheadPosition: number;
    play: () => void;
    pause: () => void;
    stop: () => void;
    setPosition: (ms: number) => void;
    player: Player;
}

const TransportContext = createContext<TransportContextValue | null>(null);

export default function TransportProvider({ children }: { children: React.ReactNode }) {
    const { player, graph } = useMemo(() => {
        const scheduler = new Scheduler();
        const audioGraph = new AudioGraph(new SampleBank());

        return { player: new Player(scheduler, audioGraph), graph: audioGraph };
    }, []);

    const [isPlaying, setIsPlaying] = useState(false);
    const [playheadPosition, setPlayheadPosition] = useState(0);

    useEffect(() => {
        return () => {
            player.destroy();
            void graph.close();
        };
    }, [player, graph]);

    // Starting the context here rather than at construction is what makes the
    // first Play audible: browsers only let it start from a user gesture.
    const play = useCallback(() => {
        graph
            .ensureRunning()
            .then(() => {
                player.play();
                setIsPlaying(true);
            })
            .catch((error: unknown) => log.error("could not start audio", error));
    }, [player, graph]);

    const pause = useCallback(() => {
        player.pause();
        setIsPlaying(false);
        setPlayheadPosition(player.positionMs());
    }, [player]);

    const stop = useCallback(() => {
        player.stop();
        setIsPlaying(false);
        setPlayheadPosition(0);
    }, [player]);

    const setPosition = useCallback(
        (ms: number) => {
            player.seek(ms);
            setPlayheadPosition(ms);
        },
        [player],
    );

    const value = useMemo(
        () => ({ isPlaying, playheadPosition, play, pause, stop, setPosition, player }),
        [isPlaying, playheadPosition, play, pause, stop, setPosition, player],
    );

    return <TransportContext value={value}>{children}</TransportContext>;
}

export function useTransportContext(): TransportContextValue {
    const context = use(TransportContext);

    if (!context) throw new Error("useTransportContext must be used within TransportProvider");

    return context;
}
