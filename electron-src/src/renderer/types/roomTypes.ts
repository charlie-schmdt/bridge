export type VideoLayout = "grid" | "speaker";

export type SignalMessageType = "join" | "exit" | "peerExit" | "offer" | "answer" | "candidate" | "subscribe" | "unsubscribe" | "pli";

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

export type CallStatus = "active" | "inactive" | "loading";