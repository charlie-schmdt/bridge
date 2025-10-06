package sfu

import (
	"fmt"

	"github.com/pion/webrtc/v3"
)

type Router interface {
	AddPeerConnection(id string, pc *webrtc.PeerConnection) error
}

type defaultRouter struct {
	connections map[string]*webrtc.PeerConnection
}

func NewRouter() Router {
	return &defaultRouter{
		connections: make(map[string]*webrtc.PeerConnection),
	}
}

func (r *defaultRouter) AddPeerConnection(id string, pc *webrtc.PeerConnection) error {
	if _, exists := r.connections[id]; exists {
		return fmt.Errorf("peer connection with id %s already exists", id)
	}
	r.connections[id] = pc
	return nil
}
