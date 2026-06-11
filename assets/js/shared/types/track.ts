import type { Clip } from "./clip";

export interface Track {
    id: number;
    project_id: number;
    row_index: number;
    clips: Clip[];
}
