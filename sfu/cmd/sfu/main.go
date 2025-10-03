//go:generate protoc --go_out=./proto --go-grpc_out=./proto -I../../../proto ../../../proto/sfu.proto
package main

import (
	"sfu/internal/webrtc"
)

func main() {
	// Initialize a new WebRTC peer connection
	// Serve a WebSocket server for connections from the Node server
	webrtc.ServeWebSocket(webrtc.CreatePeerConnection)

}
