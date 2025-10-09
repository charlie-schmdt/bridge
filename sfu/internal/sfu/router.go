package sfu

import (
	"fmt"
	"sync"

	"github.com/pion/webrtc/v3"
)

type Router interface {
	AddPeerConnection(id string, pc *webrtc.PeerConnection) error
	RemovePeerConnection(id string) error
	ForwardVideoTrack(id string, track *webrtc.TrackRemote) error
	GetPeerConnection(id string) *webrtc.PeerConnection
}

type defaultRouter struct {
	connections  map[string]*webrtc.PeerConnection
	broadcasters map[string]Broadcaster
	mu           sync.Mutex
}

func NewRouter() Router {
	return &defaultRouter{
		connections:  make(map[string]*webrtc.PeerConnection),
		broadcasters: make(map[string]Broadcaster),
	}
}

func (r *defaultRouter) GetPeerConnection(id string) *webrtc.PeerConnection {
	pc, exists := r.connections[id]
	if !exists {
		return nil
	}
	return pc
}

func (r *defaultRouter) AddPeerConnection(id string, pc *webrtc.PeerConnection) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.connections[id]; exists {
		fmt.Printf("PeerConnection with id %s already exists, replacing PeerConnection\n", id)
	}
	// If peer is present already, add the track
	if len(r.connections) > 0 {
		// Add peer to the new PeerConnection
		for rid, broadcaster := range r.broadcasters {
			if rid != id {
				broadcaster.AddSink(id, pc)
			}
		}
	}
	r.connections[id] = pc
	return nil
}

func (r *defaultRouter) RemovePeerConnection(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Delete broadcaster
	if _, exists := r.broadcasters[id]; !exists {
		return fmt.Errorf("Broadcaster for connection %s doesn't exist", id)
	}
	r.broadcasters[id].Close()
	delete(r.broadcasters, id)

	// Remove local sinks from all other broadcasters
	for _, broadcaster := range r.broadcasters {
		broadcaster.RemoveSink(id)
	}

	// Delete from connections
	if _, exists := r.connections[id]; !exists {
		return fmt.Errorf("PeerConnection does not exist: %s", id)
	}
	err := r.connections[id].Close()
	delete(r.connections, id)
	if err != nil {
		return fmt.Errorf("failed to close PeerConnection: %w", err)
	}

	return nil
}

func (r *defaultRouter) ForwardVideoTrack(id string, remote *webrtc.TrackRemote) error {
	_, exists := r.connections[id]
	if !exists {
		return fmt.Errorf("PeerConnection with id %s does not exist", id)
	}

	// Add a broadcaster for the video track
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.broadcasters[id]; exists {
		return fmt.Errorf("broadcaster with id %s already exists", id)
	}

	broadcaster := InitBroadcaster(remote)
	r.broadcasters[id] = broadcaster

	// Automatically forward video to all peers -- TODO subscriber management
	for rid, pc := range r.connections {
		if rid != id {
			broadcaster.AddSink(rid, pc)
		}
	}
	return nil
}
