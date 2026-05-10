import { useEffect, useRef, useState } from 'react';
import { Clip } from 'js/shared/types';
import { updateClip } from '../api/clips';

interface Props {
    clip: Clip;
    projectId: number;
    trackId: number;
    pixelsPerMillisecond: number;
}

export function useClipInteraction({ clip, projectId, trackId, pixelsPerMillisecond }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [tempStartTime, setTempStartTime] = useState(clip.start_time);
    const tempStartTimeRef = useRef(tempStartTime);

    useEffect(() => {
        if (!isDragging) return;

        function handleMouseMove(e: MouseEvent) {
            setTempStartTime(prev => {
                const next = Math.max(0, prev + e.movementX / pixelsPerMillisecond);
                tempStartTimeRef.current = next;
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
