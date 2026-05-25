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
    const tempStartTimeRef = useRef(tempStartTime);

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
            setIsDragging(false);
            updateClip(projectId, trackId, clip.id, {
                start_time: Math.round(tempStartTimeRef.current),
                duration: clip.duration,
            });
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return {
        isDragging,
        tempStartTime,
        startDrag: () => setIsDragging(true),
    };
}
