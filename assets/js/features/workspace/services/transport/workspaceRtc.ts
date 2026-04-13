import { SignalingChannel } from "../signaling/signalingChannel";
import { workspaceBus } from "../workspaceBus";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

type SignalMessage =
    | { type: "join" }
    | { type: "offer"; sdp: RTCSessionDescriptionInit }
    | { type: "answer"; sdp: RTCSessionDescriptionInit }
    | { type: "ice"; candidate: RTCIceCandidateInit };

export class WorkspaceRtc {
    private pc: RTCPeerConnection;
    private dataChannel: RTCDataChannel | null = null;
    private signaling: SignalingChannel;
    private sessionId: string;
    private signalingRef: number | null = null;
    private makingOffer = false;
    // ICE candidates that arrived before remoteDescription was set
    private pendingIceCandidates: RTCIceCandidateInit[] = [];

    constructor(workspaceId: string, sessionId: string) {
        this.sessionId = sessionId;
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        this.signaling = new SignalingChannel(workspaceId).join();

        this.setupSignaling();
        this.setupIceCandidate();
        this.setupRemoteDataChannel();

        // Announce presence — existing peers will respond by initiating a connection
        this.signaling.push({ type: "join" });
    }

    // ─── Signaling ────────────────────────────────────────────────────────────

    private setupSignaling(): void {
        this.signalingRef = this.signaling.on(async (raw) => {
            const msg = raw as SignalMessage;
            try {
                // A new peer joined — we are the existing peer, so we initiate
                if (msg.type === "join") {
                    await this.initiateConnection();
                    return;
                }

                if (msg.type === "offer") {
                    const offerCollision =
                        this.makingOffer || this.pc.signalingState !== "stable";

                    if (offerCollision) return;

                    await this.pc.setRemoteDescription(msg.sdp);
                    await this.flushPendingIceCandidates();
                    const answer = await this.pc.createAnswer();
                    await this.pc.setLocalDescription(answer);
                    this.signaling.push({ type: "answer", sdp: answer });
                }

                if (msg.type === "answer") {
                    await this.pc.setRemoteDescription(msg.sdp);
                    await this.flushPendingIceCandidates();
                }

                if (msg.type === "ice") {
                    if (this.pc.remoteDescription) {
                        await this.pc.addIceCandidate(msg.candidate);
                    } else {
                        this.pendingIceCandidates.push(msg.candidate);
                    }
                }
            } catch (err) {
                console.error("[WorkspaceRtc] signaling error", err);
            }
        });
    }

    private setupIceCandidate(): void {
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signaling.push({ type: "ice", candidate: event.candidate.toJSON() });
            }
        };
    }

    private async flushPendingIceCandidates(): Promise<void> {
        const candidates = this.pendingIceCandidates.splice(0);
        for (const candidate of candidates) {
            await this.pc.addIceCandidate(candidate);
        }
    }

    // ─── DataChannel ─────────────────────────────────────────────────────────

    async initiateConnection(): Promise<void> {
        this.dataChannel = this.pc.createDataChannel("ephemeral", {
            ordered: false,
            maxRetransmits: 0,
        });
        this.bindDataChannelEvents(this.dataChannel);

        try {
            this.makingOffer = true;
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            this.signaling.push({ type: "offer", sdp: offer });
        } catch (err) {
            console.error("[WorkspaceRtc] offer error", err);
        } finally {
            this.makingOffer = false;
        }
    }

    private setupRemoteDataChannel(): void {
        this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.bindDataChannelEvents(this.dataChannel);
        };
    }

    private bindDataChannelEvents(channel: RTCDataChannel): void {
        channel.onopen = () => console.log("[WorkspaceRtc] DataChannel open");
        channel.onclose = () => console.log("[WorkspaceRtc] DataChannel closed");

        channel.onmessage = (event) => {
            try {
                const { event: name, payload } = JSON.parse(event.data as string) as {
                    event: string;
                    payload: unknown;
                };
                workspaceBus.emit(name, payload);
            } catch (err) {
                console.error("[WorkspaceRtc] failed to parse message", err);
            }
        };
    }

    // ─── Outbound ─────────────────────────────────────────────────────────────

    send(event: string, payload: unknown): void {
        if (this.dataChannel?.readyState === "open") {
            this.dataChannel.send(JSON.stringify({ event, payload }));
        }
    }

    // ─── Cleanup ──────────────────────────────────────────────────────────────

    destroy(): void {
        if (this.signalingRef !== null) {
            this.signaling.off(this.signalingRef);
        }
        this.signaling.leave();
        this.dataChannel?.close();
        this.pc.close();
    }
}
