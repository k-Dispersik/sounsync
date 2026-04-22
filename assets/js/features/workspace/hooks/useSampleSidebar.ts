import { useEffect, useState } from "react";

export default function useSampleSidebar(tracks: any[]) {
    const [track, setTrack] = useState(tracks);

    useEffect(() => {
        const clips = tracks.flatMap(track => track.clips);
        setTrack(clips);
    }, [tracks]);

    return track;
}