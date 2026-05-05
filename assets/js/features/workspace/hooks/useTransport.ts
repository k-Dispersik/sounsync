import { useState, useRef, useEffect } from 'react';

export function useTransport() {
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const startTimeRef = useRef<number | null>(null);
    const startOffsetRef = useRef(0);

    const play = () => {
        startTimeRef.current = performance.now();
        startOffsetRef.current = playheadPosition;
        setIsPlaying(true);
    };

    const stop = () => {
        setIsPlaying(false);
        setPlayheadPosition(0);
        startTimeRef.current = null;
        startOffsetRef.current = 0;
    };
    const pause = () => {
        setIsPlaying(false);
        startTimeRef.current = null;
        startOffsetRef.current = playheadPosition;
    };

    const setPosition = (ms: number) => {
        setPlayheadPosition(ms);
    };

    useEffect(() => {
        if (!isPlaying) return;

        let frameId: number;

        const loop = (now: number) => {
            if (startTimeRef.current == null) return;

            const elapsed = now - startTimeRef.current;
            setPlayheadPosition(startOffsetRef.current + elapsed);

            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [isPlaying]);

    return {
        playheadPosition,
        isPlaying,
        play,
        pause,
        stop,
        setPosition,
    };
}