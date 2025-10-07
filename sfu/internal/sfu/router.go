package sfu

import (
	"fmt"
	"sync"

	"github.com/pion/webrtc/v3"
)

type Router interface {
	AddPeerConnection(id string, pc *webrtc.PeerConnection) error
	ForwardVideoTrack(id string, track *webrtc.TrackRemote) error
}

type defaultRouter struct {
	connections  map[string]*webrtc.PeerConnection
	broadcasters map[string]Broadcaster
	mu           sync.Mutex
}

func NewRouter() Router {
	return &defaultRouter{
		connections: make(map[string]*webrtc.PeerConnection),
	}
}

func (r *defaultRouter) AddPeerConnection(id string, pc *webrtc.PeerConnection) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.connections[id]; exists {
		return fmt.Errorf("peer connection with id %s already exists", id)
	}
	r.connections[id] = pc
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
			localTrack, err := webrtc.NewTrackLocalStaticRTP(remote.Codec().RTPCodecCapability, remote.ID(), remote.StreamID())
			if err != nil {
				return fmt.Errorf("failed to create local track: %w", err)
			}
			_, err = pc.AddTrack(localTrack)
			if err != nil {
				return fmt.Errorf("failed to add track to PeerConnection: %w", err)
			}
			broadcaster.AddSink(rid, localTrack)
		}
	}
	return nil
}
