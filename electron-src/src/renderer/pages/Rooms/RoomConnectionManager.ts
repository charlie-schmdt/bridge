import { CallStatus, Exit, IceCandidate, Join, PeerExit, SdpAnswer, SdpOffer, SignalMessage, SignalMessageType } from "@/renderer/types/roomTypes";
import { WebSocketURL } from "@/renderer/utils/endpoints";

// Define React callbacks for the RoomFeed renderer to provide
export interface RoomConnectionManagerCallbacks {
  onStatusChange: (status: CallStatus) => void;
  onRemoteTrack: (track: MediaStreamTrack) => void;
  onRemoteStreamStopped: () => void;
  onPeerExit: (peerName: string) => void;
  onError: (message: string) => void;
}

export class RoomConnectionManager {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;

  private roomId: string;
  private clientId: string;
  private userName: string;
  private callbacks: RoomConnectionManagerCallbacks;

  // Internal state
  private exited = true;

  constructor(
    roomId: string,
    clientId: string,
    userName: string,
    callbacks: RoomConnectionManagerCallbacks
  ) {
    this.roomId = roomId;
    this.clientId = clientId;
    this.userName = userName;
    this.callbacks = callbacks;
  }

  public initSignalingConnection(): void {
    this.ws = new WebSocket(WebSocketURL);
    this.exited = true;

    // Register websocket handlers
    this.ws.onopen = () => {
      console.log("WebSocket connected.");
    };
    
    this.ws.onmessage = (event: MessageEvent) => {
      // Default handler for before webRTC connection is activated
      console.log("WS msg (webrtc inactive): ", JSON.parse(event.data));
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.disconnect();
    }

    this.ws.onerror = (err) => {
      console.error("Websocket error: ", err);
      this.callbacks.onError("Signaling server connection failed");
    };
  }

  public async connect(localStream: MediaStream, micAudioStream: MediaStream): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.callbacks.onError("Signaling server not connected");
      return;
    }
    
    this.callbacks.onStatusChange("loading");
    this.exited = false;

    try {
      this.pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com"
          }
        ]
      });

      this.pc.addTrack(localStream.getVideoTracks()[0], localStream);
      this.pc.addTrack(micAudioStream.getAudioTracks()[0], micAudioStream)

      this.pc.onicecandidate = this.handleIceCandidate;
      this.pc.onconnectionstatechange = this.handleConnectionStateChange;
      this.pc.ontrack = this.handleTrack;

      this.ws.onmessage = this.handleWsMessage;
    
      const namePayload: Join = { name: this.userName };
      this.sendMessage("join", namePayload);
    } catch (err) {
      console.error("Error during connection setup:", err);
      this.callbacks.onError("Failed to start call");
      this.disconnect();
    }
  }

  public disconnect(): void {
    if (this.exited) {
      return; // Already disconnected
    }
    console.log("Disconnecting...");
    this.exited = true;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: Exit = { peerName: this.userName };
      this.sendMessage("exit", payload);
    }

    // Reset the message handler to just print the message
    if (this.ws) {
      this.ws.onmessage = (event: MessageEvent) => {
        console.log("WS msg (inactive): ", JSON.parse(event.data))
      };
    }

    // Reset PeerConnection handlers to do nothing
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      this.pc.ontrack = null;
      this.pc.close();
      this.pc = null;
    }

    this.callbacks.onStatusChange("inactive");
    this.callbacks.onRemoteStreamStopped();

    // NOTE: don't disconnect the signaling WebSocket until component is unmounted
  }

  public cleanup(): void {
    // For component unmounting
    this.disconnect(); // In case it wasn't called already (idempotent)
    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect if exists
      this.ws.close();
      this.ws = null
    }
  }

  private handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      this.sendMessage("candidate", event.candidate);
    }
    else {
      console.log("Received invalid ICE candidate event: ", event);
    }
  }

  private handleConnectionStateChange = () => {
    if (!this.pc) return;

    console.log("PC Connection update: ", this.pc.connectionState);
    switch (this.pc.connectionState) {
      case "connected":
        this.callbacks.onStatusChange("active");
        break;
      case "disconnected":
      case "failed":
      case "closed":
        this.disconnect(); // Trigger PC disconnect (keep signaling WebSocket open)
        break;
    }
  }

  private handleTrack = (event: RTCTrackEvent) => {
    console.log("Received remote track: ", event);
    const remoteTrack = event.track;
    if (remoteTrack) {
      this.callbacks.onRemoteTrack(remoteTrack);

      // Request a key frame to start decoding video frames
      this.sendMessage("pli", {})
    }
  }

  private handleWsMessage = async (event: MessageEvent) => {
    if (!this.pc) return;

    const msg: SignalMessage = JSON.parse(event.data);
    console.log("msg (call active): ", msg);

    try {
      switch (msg.type) {
        case "offer":
          const offer = msg.payload as SdpOffer;
          await this.pc.setRemoteDescription(new RTCSessionDescription({type: "offer", sdp: offer.sdp}));
          const ans = await this.pc.createAnswer();
          await this.pc.setLocalDescription(ans);
          this.sendMessage("answer", this.pc.localDescription)
          break;
        case "answer":
          const answer = msg.payload as SdpAnswer;
          await this.pc.setRemoteDescription(new RTCSessionDescription({type: "answer", sdp: answer.sdp}));
          break;
        case "candidate":
          const candidate = msg.payload as IceCandidate;
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
          break;
        case "peerExit":
          const peerExit = msg.payload as PeerExit;
          this.callbacks.onPeerExit(peerExit.peerName);
          this.callbacks.onRemoteStreamStopped();
          this.disconnect();
          break;
      }
    } catch (err) {
      console.error("Error in WS message handler: ", err);
    }
  };

  private sendMessage(type: SignalMessageType, payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message, WebSocket is not available. Type: ", type);
      return;
    }
    const msg: SignalMessage = {
      type,
      clientId: this.clientId,
      roomId: this.roomId,
      payload
    };
    try {
      this.ws.send(JSON.stringify(msg));
    } catch (err) {
      console.error(`Failed to send WebSocket message (Type: ${type}):`, err);
    }
  }
}
