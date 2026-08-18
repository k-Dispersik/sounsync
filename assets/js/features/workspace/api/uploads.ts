import axios from "axios";

import apiClient from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import { audioFileSchema, uploadAnnouncementSchema } from "@/shared/api/schemas";
import { readToken } from "@/shared/auth/storage";
import type { AudioFile, UploadAnnouncement, UploadInstruction } from "@/shared/types";

/**
 * The bytes go to wherever the server said, which in production is S3 and not
 * us. This client has no interceptors on purpose: the session token must not
 * be attached to a request leaving for a third party.
 */
const bytesClient = axios.create();

export async function announceUpload(
    projectId: number,
    file: File,
    signal?: AbortSignal,
): Promise<UploadAnnouncement> {
    const { data } = await apiClient.post<unknown>(
        `/projects/${projectId}/uploads`,
        {
            original_filename: file.name,
            content_type: file.type || "application/octet-stream",
            byte_size: file.size,
            checksum: await checksum(file),
        },
        { signal },
    );

    return parseResponse(uploadAnnouncementSchema, `POST /projects/${projectId}/uploads`, data);
}

export async function sendBytes(
    instruction: UploadInstruction,
    file: File,
    options: { signal?: AbortSignal; onProgress?: (fraction: number) => void } = {},
): Promise<void> {
    await bytesClient.request({
        method: instruction.method,
        url: instruction.url,
        data: file,
        headers: withCredentialsIfOurs(instruction),
        signal: options.signal,
        onUploadProgress: (event) => {
            if (event.total) options.onProgress?.(event.loaded / event.total);
        },
    });
}

export async function completeUpload(audioFileId: number): Promise<AudioFile> {
    const { data } = await apiClient.post<unknown>(`/uploads/${audioFileId}/complete`);
    return parseResponse(audioFileSchema, `POST /uploads/${audioFileId}/complete`, data);
}

function withCredentialsIfOurs(instruction: UploadInstruction): Record<string, string> {
    if (/^https?:\/\//i.test(instruction.url)) return instruction.headers;

    const token = readToken();

    return token
        ? { ...instruction.headers, Authorization: `Bearer ${token}` }
        : instruction.headers;
}

/**
 * SHA-256 of the file, so the server can recognise bytes it already holds and
 * skip the upload entirely. Falls back to no checksum where WebCrypto is not
 * available (an insecure origin); the upload still works, just without dedup.
 */
async function checksum(file: File): Promise<string | undefined> {
    if (!globalThis.crypto?.subtle) return undefined;

    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());

    return (
        "sha256-" +
        Array.from(new Uint8Array(digest))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
    );
}
