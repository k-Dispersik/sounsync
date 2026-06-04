export class SampleBank {
    private ctx: AudioContext;
    private buffers = new Map<string, AudioBuffer>();

    constructor(ctx: AudioContext) {
        this.ctx = ctx;
    }

    async load(name: string, url: string) {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();

        const buffer = await this.ctx.decodeAudioData(arrayBuffer);

        this.buffers.set(name, buffer);
    }

    get(name: string): AudioBuffer | undefined {
        return this.buffers.get(name);
    }
}