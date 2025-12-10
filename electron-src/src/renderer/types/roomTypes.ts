export type VideoLayout = "grid" | "speaker";

export type SignalMessageType = "join"
  | "exit"
  | "peerExit"
  | "offer"
  | "answer"
  | "candidate"
  | "subscribe"
  | "unsubscribe"
  | "pli"
  | "screenShareRequest"
  | "peerScreenShare"
  | "peerScreenShareStop";

export interface SignalMessage {
  type: SignalMessageType;
  clientId?: string;
  roomId?: string;
  payload?: unknown;
}

export interface SdpOffer {
  sdp: string;
}

export interface SdpAnswer {
  sdp: string;
}

export interface IceCandidate {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}

export interface Exit {
  peerName: string;
}

export interface PeerExit {
  peerId: string;
  peerName: string;
}

export interface Join {
  name: string;
}

// Used to request a screen share from the server
export interface ScreenShareRequest {
  streamId: string;
}

// Used to receive notice about a peer starting a screen share
export interface PeerScreenShare {
  peerId: string;
  streamId: string;
}

// Used to gracefully stop a peer's screen share
// Also used to send out from user, but payload peerId is unused
export interface PeerScreenShareStop {
  peerId: string;
}

export type CallStatus = "active" | "inactive" | "loading";