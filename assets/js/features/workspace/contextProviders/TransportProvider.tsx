import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { createLogger } from "@/shared/lib/logger";
import type { Project } from "@/shared/types";
import { AudioGraph } from "../services/audio/AudioGraph";
import { compileProject } from "../services/audio/compile";
import { Player } from "../services/audio/Player";
import { SampleBank } from "../services/audio/SampleBank";
import { Scheduler } from "../services/audio/Scheduler";

const log = createLogger("Transport");

interface TransportContextValue {
    isPlaying: boolean;
    /** True while samples are being fetched, before sound can start. */
    isLoading: boolean;
    playheadPosition: number;
    play: () => void;
    pause: () => void;
    stop: () => void;
    setPosition: (ms: number) => void;
    player: Player;
}

const TransportContext = createContext<TransportContextValue | null>(null);

export default function TransportProvider({
    project,
    children,
}: {
    project?: Project | null;
    children: React.ReactNode;
}) {
    const { player, graph, scheduler, samples } = useMemo(() => {
        const bank = new SampleBank();
        const audioGraph = new AudioGraph(bank);
        const eventScheduler = new Scheduler();

        return {
            player: new Player(eventScheduler, audioGraph),
            graph: audioGraph,
            scheduler: eventScheduler,
            samples: bank,
        };
    }, []);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [playheadPosition, setPlayheadPosition] = useState(0);

    const compiled = useMemo(() => compileProject(project), [project]);

    // The scheduler always holds the current project: an edit made while
    // playing takes effect on the next window rather than at the next Play.
    useEffect(() => {
        scheduler.setEvents(compiled.events);
    }, [scheduler, compiled]);

    useEffect(() => {
        return () => {
            player.destroy();
            void graph.close();
        };
    }, [player, graph]);

    // Starting the context here rather than at construction is what makes the
    // first Play audible: browsers only let it start from a user gesture.
    const play = useCallback(() => {
        setIsLoading(true);

        graph
            .ensureRunning()
            // Waiting for the samples first: starting without them would play
            // silence for the first bar and look like a broken transport.
            .then(async (context) => {
                await samples.loadAll(context, compiled.samples);
                player.play();
                setIsPlaying(true);
            })
            .catch((error: unknown) => log.error("could not start audio", error))
            .finally(() => setIsLoading(false));
    }, [player, graph, samples, compiled]);

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
        () => ({ isPlaying, isLoading, playheadPosition, play, pause, stop, setPosition, player }),
        [isPlaying, isLoading, playheadPosition, play, pause, stop, setPosition, player],
    );

    return <TransportContext value={value}>{children}</TransportContext>;
}

export function useTransportContext(): TransportContextValue {
    const context = use(TransportContext);

    if (!context) throw new Error("useTransportContext must be used within TransportProvider");

    return context;
}
