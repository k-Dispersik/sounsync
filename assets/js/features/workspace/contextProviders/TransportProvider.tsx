import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

import { createLogger } from "@/shared/lib/logger";
import type { Project } from "@/shared/types";
import { AudioGraph } from "../services/audio/AudioGraph";
import {
    EMPTY_MIXER,
    effectiveGain,
    setMaster,
    setVolume,
    toggleMute,
    toggleSolo,
    trackMix,
    type MixerState,
    type TrackMix,
} from "../model/mixer";
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
    mixer: MixerState;
    trackMix: (trackId: number) => TrackMix;
    toggleTrackMute: (trackId: number) => void;
    toggleTrackSolo: (trackId: number) => void;
    setTrackVolume: (trackId: number, volume: number) => void;
    setMasterVolume: (volume: number) => void;
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
    const [mixer, setMixer] = useState<MixerState>(EMPTY_MIXER);

    const compiled = useMemo(() => compileProject(project), [project]);

    // Levels are pushed to the graph whenever they change, including while
    // playing: muting a track has to take effect now, not at the next Play.
    useEffect(() => {
        const trackIds = new Set([
            ...Object.keys(mixer.tracks).map(Number),
            ...compiled.events.map((event) => event.trackId),
        ]);

        graph.setMasterGain(mixer.master);

        for (const trackId of trackIds) graph.setTrackGain(trackId, effectiveGain(mixer, trackId));
    }, [graph, mixer, compiled]);

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

    const mixerActions = useMemo(
        () => ({
            trackMix: (trackId: number) => trackMix(mixer, trackId),
            toggleTrackMute: (trackId: number) =>
                setMixer((current) => toggleMute(current, trackId)),
            toggleTrackSolo: (trackId: number) =>
                setMixer((current) => toggleSolo(current, trackId)),
            setTrackVolume: (trackId: number, volume: number) =>
                setMixer((current) => setVolume(current, trackId, volume)),
            setMasterVolume: (volume: number) => setMixer((current) => setMaster(current, volume)),
        }),
        [mixer],
    );

    const value = useMemo(
        () => ({
            isPlaying,
            isLoading,
            playheadPosition,
            play,
            pause,
            stop,
            setPosition,
            player,
            mixer,
            ...mixerActions,
        }),
        [
            isPlaying,
            isLoading,
            playheadPosition,
            play,
            pause,
            stop,
            setPosition,
            player,
            mixer,
            mixerActions,
        ],
    );

    return <TransportContext value={value}>{children}</TransportContext>;
}

export function useTransportContext(): TransportContextValue {
    const context = use(TransportContext);

    if (!context) throw new Error("useTransportContext must be used within TransportProvider");

    return context;
}
