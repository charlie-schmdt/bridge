package sfu

import (
	"fmt"
	"log"
	"sync"

	"github.com/pion/webrtc/v3"
)

type Router interface {
	AddPeerConnection(id string, name string, pc *webrtc.PeerConnection) error
	RemovePeerConnection(id string, closeSubscriber func(id string)) error
	ForwardVideoTrack(id string, track *webrtc.TrackRemote, isScreenShare bool) error
	ForwardAudioTrack(id string, track *webrtc.TrackRemote, isScreenShare bool) error
	GetPeerConnection(id string) *webrtc.PeerConnection
	GetName(id string) string
	RequestKeyFrames(id string) error
}

type defaultRouter struct {
	names        map[string]string
	connections  map[string]*webrtc.PeerConnection
	broadcasters map[string]Broadcaster
	mu           sync.Mutex
}

func NewRouter() Router {
	return &defaultRouter{
		names:        make(map[string]string),
		connections:  make(map[string]*webrtc.PeerConnection),
		broadcasters: make(map[string]Broadcaster),
	}
}

func (r *defaultRouter) GetPeerConnection(id string) *webrtc.PeerConnection {
	pc, ok := r.connections[id]
	if !ok {
		return nil
	}
	return pc
}

func (r *defaultRouter) GetName(id string) string {
	name, ok := r.names[id]
	if !ok {
		return ""
	}
	return name
}

func (r *defaultRouter) AddPeerConnection(id string, name string, pc *webrtc.PeerConnection) error {
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
				broadcaster.AddVideoSink(id, pc)
				broadcaster.AddAudioSink(id, pc)
			}
		}
	}
	r.connections[id] = pc
	log.Println("Adding name")
	r.names[id] = name
	return nil
}

func (r *defaultRouter) RemovePeerConnection(id string, closeSubscriber func(id string)) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Delete broadcaster
	if _, exists := r.broadcasters[id]; !exists {
		return fmt.Errorf("Broadcaster for connection %s doesn't exist", id)
	}
	r.broadcasters[id].Close(closeSubscriber)
	delete(r.broadcasters, id)

	// Remove local sinks from all other broadcasters
	for _, broadcaster := range r.broadcasters {
		broadcaster.RemoveSinks(id)
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

func (r *defaultRouter) ForwardAudioTrack(id string, remote *webrtc.TrackRemote, isScreenShare bool) error {
	rpc, exists := r.connections[id]
	if !exists {
		return fmt.Errorf("PeerConnection with id %s does not exist", id)
	}

	// Add a broadcaster for the audio track
	r.mu.Lock()
	defer r.mu.Unlock()
	var broadcaster Broadcaster
	if _, exists := r.broadcasters[id]; exists {
		broadcaster = r.broadcasters[id]
		broadcaster.SetAudioSource(remote)
	} else {
		broadcaster = InitBroadcaster(id, rpc, nil, remote, nil)
		r.broadcasters[id] = broadcaster
	}

	// Automatically forward audio to all peers -- TODO subscriber management
	for rid, pc := range r.connections {
		if rid != id {
			broadcaster.AddAudioSink(rid, pc)
		}
	}
	return nil

}

func (r *defaultRouter) ForwardVideoTrack(id string, remote *webrtc.TrackRemote, isScreenShare bool) error {
	//forwardedPc, exists := r.connections[id]
	rpc, exists := r.connections[id]
	if !exists {
		return fmt.Errorf("PeerConnection with id %s does not exist", id)
	}

	// Add a broadcaster for the video track
	r.mu.Lock()
	defer r.mu.Unlock()
	var broadcaster Broadcaster
	if _, exists := r.broadcasters[id]; exists {
		broadcaster = r.broadcasters[id]
		if isScreenShare {
			broadcaster.SetScreenSource(remote)
		} else {
			broadcaster.SetVideoSource(remote)
		}
	} else {
		if isScreenShare {
			broadcaster = InitBroadcaster(id, rpc, nil, nil, remote)
		} else {
			broadcaster = InitBroadcaster(id, rpc, remote, nil, nil)
		}
		r.broadcasters[id] = broadcaster
	}

	// Automatically forward video to all peers -- TODO subscriber management
	for rid, pc := range r.connections {
		if rid != id {
			broadcaster.AddVideoSink(rid, pc)
		}
	}

	//forwardedBroadcaster := r.broadcasters[id]
	//if forwardedBroadcaster == nil {
	//	return fmt.Errorf("Broadcaster for PeerConnection with id %s does not exist", id)
	//}
	//forwardedBroadcaster.SendPublisherPli()

	return nil
}

func (r *defaultRouter) RequestKeyFrames(id string) error {
	log.Printf("Requesting keyframes for id %s", id)
	for rid, rbd := range r.broadcasters {
		if rid != id {
			rbd.SendAllPublisherPli()
		}
	}
	return nil
}
