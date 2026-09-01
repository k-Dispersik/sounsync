import { useEffect, useRef, useState } from "react";
import { Clip } from "@/shared/types";
import { useRealtime } from "../contextProviders/RealtimeProvider";
import { RealtimeEvents } from "../events/events";
import { OPERATIONS } from "../model/operations";
import { getOrCreateSessionId } from "../services/signaling/workspaceChannel";
import { createLogger } from "@/shared/lib/logger";
import { throttle } from "@/shared/lib/rate";

const log = createLogger("ClipInteraction");

// A gaming mouse fires well over a hundred times a second; thirty is as much
// as anyone can see, and the last position is sent as an edit anyway.
const PREVIEW_HZ = 30;

interface Props {
    clip: Clip;
    trackId: number;
    pixelsPerMillisecond: number;
}

export function useClipInteraction({ clip, trackId, pixelsPerMillisecond }: Props) {
    const { broadcast, sendOperation } = useRealtime();
    const sessionId = getOrCreateSessionId();

    const [isDragging, setIsDragging] = useState(false);
    const [tempStartTime, setTempStartTime] = useState(clip.start_time);
    const [committedStartTime, setCommittedStartTime] = useState(clip.start_time);
    const tempStartTimeRef = useRef(tempStartTime);
    const committedStartTimeRef = useRef(committedStartTime);
    const lastSyncedClipStartTimeRef = useRef(clip.start_time);

    useEffect(() => {
        if (isDragging) return;
        if (clip.start_time === lastSyncedClipStartTimeRef.current) return;

        lastSyncedClipStartTimeRef.current = clip.start_time;
        setTempStartTime(clip.start_time);
        setCommittedStartTime(clip.start_time);
        tempStartTimeRef.current = clip.start_time;
        committedStartTimeRef.current = clip.start_time;
    }, [clip.start_time, isDragging]);

    useEffect(() => {
        if (!isDragging) return;

        const previewMove = throttle((startTime: number) => {
            broadcast(RealtimeEvents.CLIP_MOVED, {
                session_id: sessionId,
                clip_id: clip.id,
                track_id: trackId,
                start_time: startTime,
            });
        }, 1000 / PREVIEW_HZ);

        function handleMouseMove(e: MouseEvent) {
            setTempStartTime((prev) => {
                const next = Math.max(0, prev + e.movementX / pixelsPerMillisecond);
                tempStartTimeRef.current = next;
                previewMove(next);
                return next;
            });
        }

        function handleMouseUp() {
            // Whatever the throttle was holding is where the clip actually is.
            previewMove.flush();

            const previousCommittedStartTime = committedStartTimeRef.current;
            const nextStartTime = Math.round(tempStartTimeRef.current);
            setIsDragging(false);
            setCommittedStartTime(nextStartTime);
            committedStartTimeRef.current = nextStartTime;

            // The drag itself was previewed over WebRTC, where dropping a
            // frame costs nothing. Where the clip actually ended up is an edit,
            // so it goes over the channel and is written down.
            void sendOperation(OPERATIONS.CLIP_MOVE, {
                clip_id: clip.id,
                track_id: trackId,
                start_time: nextStartTime,
            }).catch((error: unknown) => {
                log.error("could not move the clip", error);
                setCommittedStartTime(previousCommittedStartTime);
                committedStartTimeRef.current = previousCommittedStartTime;
            });
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            previewMove.cancel();
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [broadcast, clip.id, isDragging, pixelsPerMillisecond, sendOperation, sessionId, trackId]);

    const startDrag = () => {
        const currentStartTime = committedStartTimeRef.current;
        setTempStartTime(currentStartTime);
        tempStartTimeRef.current = currentStartTime;
        setIsDragging(true);
    };

    return {
        isDragging,
        tempStartTime,
        committedStartTime,
        startDrag,
    };
}
