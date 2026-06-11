import { useEffect, useState } from "react";
import type { Track, Clip } from "js/shared/types";

export interface SidebarClip extends Clip {
    project_id: number;
}

export default function useSampleSidebar(tracks: Track[]): SidebarClip[] {
    const [clips, setClips] = useState<SidebarClip[]>([]);

    useEffect(() => {
        const enriched = tracks.flatMap((track) =>
            track.clips.map((clip) => ({ ...clip, project_id: track.project_id })),
        );
        setClips(enriched);
    }, [tracks]);

    return clips;
}
