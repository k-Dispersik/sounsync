export interface Clip {
    id: number;
    title: string;
    type: string;
    start_time: number;
    duration: number;
    file_path: string;
    track_id?: number;
    settings?: unknown;
}
