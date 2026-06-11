import { useState, useRef } from "react";
import { Player } from "../services/audio/Player";

export function useTransport(player: Player) {
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const raf = useRef<number | null>(null);
    const lastStart = useRef<number>(0);

    const play = () => {
        player.start(playheadPosition);
        lastStart.current = performance.now();
        setIsPlaying(true);

        const loop = () => {
            setPlayheadPosition(player["getCurrentTime"]?.() ?? 0);
            raf.current = requestAnimationFrame(loop);
        };

        raf.current = requestAnimationFrame(loop);
    };

    const pause = () => {
        player.pause();
        setIsPlaying(false);
        if (raf.current) cancelAnimationFrame(raf.current);
    };

    const stop = () => {
        player.stop();
        setIsPlaying(false);
        setPlayheadPosition(0);
        if (raf.current) cancelAnimationFrame(raf.current);
    };

    const setPosition = (ms: number) => {
        player.seek(ms);
        setPlayheadPosition(ms);
    };

    return {
        playheadPosition,
        isPlaying,
        play,
        pause,
        stop,
        setPosition,
    };
}
