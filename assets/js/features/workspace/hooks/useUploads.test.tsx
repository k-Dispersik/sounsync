import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../api/uploads";
import { useUploads } from "./useUploads";

vi.mock("../api/uploads", () => ({
    announceUpload: vi.fn(),
    sendBytes: vi.fn(),
    completeUpload: vi.fn(),
}));

const audioFile = {
    id: 7,
    project_id: 1,
    original_filename: "kick.wav",
    content_type: "audio/wav",
    byte_size: 1024,
    duration_ms: 800,
    status: "ready" as const,
};

const announcement = {
    audio_file: { ...audioFile, status: "pending" as const },
    upload: {
        method: "PUT",
        url: "/v1/uploads/7/data",
        headers: { "content-type": "audio/wav" },
        expires_at: new Date(Date.now() + 900_000).toISOString(),
    },
};

const file = () => new File(["RIFF"], "kick.wav", { type: "audio/wav" });

describe("useUploads", () => {
    beforeEach(() => {
        vi.mocked(api.announceUpload).mockResolvedValue(announcement);
        vi.mocked(api.sendBytes).mockResolvedValue(undefined);
        vi.mocked(api.completeUpload).mockResolvedValue(audioFile);
    });

    it("announces, sends and confirms, in that order", async () => {
        const onReady = vi.fn();
        const { result } = renderHook(() => useUploads(1, onReady));

        act(() => result.current.start([file()]));

        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("done"));
        expect(api.announceUpload).toHaveBeenCalledOnce();
        expect(api.sendBytes).toHaveBeenCalledOnce();
        expect(api.completeUpload).toHaveBeenCalledWith(7);
        expect(onReady).toHaveBeenCalledWith(audioFile);
    });

    it("skips sending bytes the project already has", async () => {
        vi.mocked(api.announceUpload).mockResolvedValue({ ...announcement, upload: null });
        const { result } = renderHook(() => useUploads(1));

        act(() => result.current.start([file()]));

        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("done"));
        expect(api.sendBytes).not.toHaveBeenCalled();
    });

    it("reports progress while the bytes are in flight", async () => {
        vi.mocked(api.sendBytes).mockImplementation((_instruction, _file, options) => {
            options?.onProgress?.(0.5);
            return Promise.resolve();
        });
        const { result } = renderHook(() => useUploads(1));

        act(() => result.current.start([file()]));

        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("done"));
        expect(result.current.uploads[0]?.progress).toBe(1);
    });

    it("shows the failure instead of losing it", async () => {
        vi.mocked(api.completeUpload).mockRejectedValue(new Error("nope"));
        const { result } = renderHook(() => useUploads(1));

        act(() => result.current.start([file()]));

        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("failed"));
        expect(result.current.uploads[0]?.error).toBeTruthy();
    });

    it("one failure does not take the other uploads with it", async () => {
        vi.mocked(api.announceUpload)
            .mockRejectedValueOnce(new Error("nope"))
            .mockResolvedValue(announcement);
        const { result } = renderHook(() => useUploads(1));

        act(() => result.current.start([file(), file()]));

        await waitFor(() => expect(result.current.uploads).toHaveLength(2));
        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("failed"));
        await waitFor(() => expect(result.current.uploads[1]?.stage).toBe("done"));
    });

    it("cancelling aborts the request rather than waiting it out", async () => {
        vi.mocked(api.sendBytes).mockImplementation(
            (_instruction, _file, options) =>
                new Promise((_resolve, reject) => {
                    options?.signal?.addEventListener("abort", () =>
                        reject(new DOMException("aborted", "AbortError")),
                    );
                }),
        );
        const { result } = renderHook(() => useUploads(1));
        act(() => result.current.start([file()]));
        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("sending"));

        act(() => result.current.cancel(result.current.uploads[0].id));

        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("cancelled"));
    });

    it("dismissing removes the row", async () => {
        const { result } = renderHook(() => useUploads(1));
        act(() => result.current.start([file()]));
        await waitFor(() => expect(result.current.uploads[0]?.stage).toBe("done"));

        act(() => result.current.dismiss(result.current.uploads[0].id));

        expect(result.current.uploads).toHaveLength(0);
    });
});
