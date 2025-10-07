package webrtc

import (
	"github.com/pion/webrtc/v3"
)

func CreatePeerConnection(offer webrtc.SessionDescription) (*webrtc.PeerConnection, error) {
	// Create a new RTCPeerConnection
	peerConnection, err := webrtc.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		return nil, err
	}
	peerConnection.SetRemoteDescription(offer)
	return peerConnection, nil
}
