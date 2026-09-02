import { createLogger } from "@/shared/lib/logger";

const log = createLogger("SampleBank");

/**
 * Decoded audio, kept by storage key.
 *
 * Two things matter here. Decoding is expensive, so a buffer is decoded once
 * and reused; and ten clips of the same sample must not start ten downloads,
 * so a load in flight is shared rather than repeated.
 *
 * The context is supplied per call rather than held: it does not exist until
 * the first user gesture, and this cache outlives any particular one.
 */
export class SampleBank {
    private buffers = new Map<string, AudioBuffer>();
    private loading = new Map<string, Promise<AudioBuffer | null>>();

    get(key: string): AudioBuffer | undefined {
        return this.buffers.get(key);
    }

    has(key: string): boolean {
        return this.buffers.has(key);
    }

    /** Loads and decodes a sample, or returns the one already held. */
    async load(context: BaseAudioContext, key: string, url: string): Promise<AudioBuffer | null> {
        const cached = this.buffers.get(key);

        if (cached) return cached;

        const inFlight = this.loading.get(key);

        if (inFlight) return inFlight;

        const request = this.fetchAndDecode(context, key, url).finally(() =>
            this.loading.delete(key),
        );

        this.loading.set(key, request);

        return request;
    }

    /** Loads everything that is not held yet, in parallel. */
    async loadAll(
        context: BaseAudioContext,
        samples: { key: string; url: string }[],
    ): Promise<void> {
        await Promise.all(samples.map(({ key, url }) => this.load(context, key, url)));
    }

    clear(): void {
        this.buffers.clear();
        this.loading.clear();
    }

    private async fetchAndDecode(
        context: BaseAudioContext,
        key: string,
        url: string,
    ): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);

            if (!response.ok) throw new Error(`${response.status} for ${url}`);

            const buffer = await context.decodeAudioData(await response.arrayBuffer());
            this.buffers.set(key, buffer);

            return buffer;
        } catch (error) {
            // A sample that will not load is a silent clip, not a dead editor.
            log.error(`could not load ${key}`, error);
            return null;
        }
    }
}
