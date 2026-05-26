import { useEffect, useRef, useState } from 'react';
import { Clip } from 'js/shared/types';
import { updateClip } from '../api/clips';
import { useRealtime } from '../contextProviders/RealtimeProvider';
import { RealtimeEvents } from '../events/events';
import { getOrCreateSessionId } from '../services/signaling/workspaceChannel';

interface Props {
    clip: Clip;
    projectId: number;
    trackId: number;
    pixelsPerMillisecond: number;
}

export function useClipInteraction({ clip, projectId, trackId, pixelsPerMillisecond }: Props) {
    const { broadcast } = useRealtime();
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

        function handleMouseMove(e: MouseEvent) {
            setTempStartTime(prev => {
                const next = Math.max(0, prev + e.movementX / pixelsPerMillisecond);
                tempStartTimeRef.current = next;
                broadcast(RealtimeEvents.CLIP_MOVED, {
                    session_id: sessionId,
                    clip_id: clip.id,
                    track_id: trackId,
                    start_time: next,
                });
                return next;
            });
        }

        function handleMouseUp() {
            const previousCommittedStartTime = committedStartTimeRef.current;
            const nextStartTime = Math.round(tempStartTimeRef.current);
            setIsDragging(false);
            setCommittedStartTime(nextStartTime);
            committedStartTimeRef.current = nextStartTime;

            void updateClip(projectId, trackId, clip.id, {
                start_time: nextStartTime,
                duration: clip.duration,
            }).catch((error) => {
                console.error('Failed to persist clip position', error);
                setCommittedStartTime(previousCommittedStartTime);
                committedStartTimeRef.current = previousCommittedStartTime;
            });
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [
        broadcast,
        clip.duration,
        clip.id,
        clip.start_time,
        isDragging,
        pixelsPerMillisecond,
        projectId,
        sessionId,
        trackId,
    ]);

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
