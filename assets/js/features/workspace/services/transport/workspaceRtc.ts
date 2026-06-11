import { SignalingChannel } from "../signaling/signalingChannel";
import { workspaceBus } from "../workspaceBus";
import { RealtimeEvents } from "../../events/events";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

// Signals now carry `from`/`to` session IDs so each peer can maintain a
// separate RTCPeerConnection per remote participant (full mesh).
type SignalMessage =
    | { type: "join"; sessionId: string }
    | { type: "offer"; sdp: RTCSessionDescriptionInit; from: string; to: string }
    | { type: "answer"; sdp: RTCSessionDescriptionInit; from: string; to: string }
    | { type: "ice"; candidate: RTCIceCandidateInit; from: string; to: string };

interface PeerState {
    pc: RTCPeerConnection;
    dataChannel: RTCDataChannel | null;
    makingOffer: boolean;
    pendingIce: RTCIceCandidateInit[];
}

export class WorkspaceRtc {
    private sessionId: string;
    private signaling: SignalingChannel;
    private signalingRef: number | null = null;
    // One RTCPeerConnection per remote peer — avoids the single-PC 1:1 limit.
    private peers = new Map<string, PeerState>();

    constructor(workspaceId: string, sessionId: string) {
        this.sessionId = sessionId;
        this.signaling = new SignalingChannel(workspaceId).join();
        this.setupSignaling();
        // Announce presence; existing peers will each open a connection to us.
        this.signaling.push({ type: "join", sessionId });
    }

    // ─── Peer management ─────────────────────────────────────────────────────

    private getOrCreatePeer(peerId: string): PeerState {
        const existing = this.peers.get(peerId);
        if (existing) return existing;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        const state: PeerState = { pc, dataChannel: null, makingOffer: false, pendingIce: [] };
        this.peers.set(peerId, state);

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                this.signaling.push({
                    type: "ice",
                    candidate: candidate.toJSON(),
                    from: this.sessionId,
                    to: peerId,
                });
            }
        };

        // Answering side receives the channel via ondatachannel.
        pc.ondatachannel = ({ channel }) => {
            state.dataChannel = channel;
            this.bindDataChannel(channel, peerId);
        };

        return state;
    }

    private async initiateConnection(peerId: string): Promise<void> {
        const state = this.getOrCreatePeer(peerId);
        const { pc } = state;

        // Offering side creates the channel.
        state.dataChannel = pc.createDataChannel("ephemeral", {
            ordered: false,
            maxRetransmits: 0,
        });
        this.bindDataChannel(state.dataChannel, peerId);

        try {
            state.makingOffer = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.signaling.push({ type: "offer", sdp: offer, from: this.sessionId, to: peerId });
        } catch (err) {
            console.error(`[WorkspaceRtc] offer error → ${peerId}`, err);
        } finally {
            state.makingOffer = false;
        }
    }

    // ─── Signaling ────────────────────────────────────────────────────────────

    private setupSignaling(): void {
        this.signalingRef = this.signaling.on(async (raw) => {
            const msg = raw as SignalMessage;
            try {
                if (msg.type === "join") {
                    // A new participant arrived — we initiate a dedicated connection.
                    await this.initiateConnection(msg.sessionId);
                    return;
                }

                // Ignore signals addressed to other peers.
                if (msg.to !== this.sessionId) return;

                const peerId = msg.from;

                if (msg.type === "offer") {
                    const state = this.getOrCreatePeer(peerId);
                    if (state.makingOffer || state.pc.signalingState !== "stable") return;
                    await state.pc.setRemoteDescription(msg.sdp);
                    await this.flushPendingIce(state);
                    const answer = await state.pc.createAnswer();
                    await state.pc.setLocalDescription(answer);
                    this.signaling.push({
                        type: "answer",
                        sdp: answer,
                        from: this.sessionId,
                        to: peerId,
                    });
                }

                if (msg.type === "answer") {
                    const state = this.peers.get(peerId);
                    if (!state) return;
                    await state.pc.setRemoteDescription(msg.sdp);
                    await this.flushPendingIce(state);
                }

                if (msg.type === "ice") {
                    const state = this.peers.get(peerId);
                    if (!state) return;
                    if (state.pc.remoteDescription) {
                        await state.pc.addIceCandidate(msg.candidate);
                    } else {
                        state.pendingIce.push(msg.candidate);
                    }
                }
            } catch (err) {
                console.error("[WorkspaceRtc] signaling error", err);
            }
        });
    }

    private async flushPendingIce(state: PeerState): Promise<void> {
        const candidates = state.pendingIce.splice(0);
        for (const c of candidates) {
            await state.pc.addIceCandidate(c);
        }
    }

    // ─── DataChannel ─────────────────────────────────────────────────────────

    private bindDataChannel(channel: RTCDataChannel, peerId: string): void {
        channel.onopen = () => {
            console.log(`[WorkspaceRtc] DataChannel open (peer: ${peerId})`);
            workspaceBus.emit(RealtimeEvents.PEER_CONNECTED, { session_id: peerId });
        };
        channel.onclose = () => {
            console.log(`[WorkspaceRtc] DataChannel closed (peer: ${peerId})`);
            workspaceBus.emit(RealtimeEvents.PEER_DISCONNECTED, { session_id: peerId });
            this.peers.delete(peerId);
        };
        channel.onmessage = ({ data }) => {
            try {
                const { event, payload } = JSON.parse(data as string) as {
                    event: string;
                    payload: unknown;
                };
                workspaceBus.emit(event, payload);
            } catch (err) {
                console.error("[WorkspaceRtc] failed to parse message", err);
            }
        };
    }

    // ─── Outbound ─────────────────────────────────────────────────────────────

    /** Returns session IDs of peers with an open DataChannel. */
    getConnectedPeers(): string[] {
        return [...this.peers.entries()]
            .filter(([, s]) => s.dataChannel?.readyState === "open")
            .map(([id]) => id);
    }

    send(event: string, payload: unknown): void {
        const data = JSON.stringify({ event, payload });
        for (const state of this.peers.values()) {
            if (state.dataChannel?.readyState === "open") {
                state.dataChannel.send(data);
            }
        }
    }

    // ─── Cleanup ──────────────────────────────────────────────────────────────

    destroy(): void {
        if (this.signalingRef !== null) this.signaling.off(this.signalingRef);
        for (const state of this.peers.values()) {
            state.dataChannel?.close();
            state.pc.close();
        }
        this.peers.clear();
        this.signaling.leave();
    }
}
