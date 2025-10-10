package signaling

import "encoding/json"

type SignalMessage struct {
	Type     SignalMessageType `json:"type"`
	ClientID string            `json:"clientId,omitempty"`
	RoomID   string            `json:"roomId,omitempty"`
	Payload  json.RawMessage   `json:"payload,omitempty"`
}

type SignalMessageType string

const (
	SignalMessageTypeJoin        SignalMessageType = "join"
	SignalMessageTypeExit        SignalMessageType = "exit"
	SignalMessageTypePeerExit    SignalMessageType = "peerExit"
	SignalMessageTypeOffer       SignalMessageType = "offer"
	SignalMessageTypeAnswer      SignalMessageType = "answer"
	SignalMessageTypeCandidate   SignalMessageType = "candidate"
	SignalMessageTypeSubscribe   SignalMessageType = "subscribe"
	SignalMessageTypeUnsubscribe SignalMessageType = "unsubscribe"
)

type SdpOffer struct {
	SDP string `json:"sdp"`
}

type SdpAnswer struct {
	SDP string `json:"sdp"`
}

type IceCandidate struct {
	Candidate        string `json:"candidate"`
	SdpMid           string `json:"sdpMid"`
	SdpMLineIndex    int    `json:"sdpMLineIndex"`
	UsernameFragment string `json:"usernameFragment"`
}
