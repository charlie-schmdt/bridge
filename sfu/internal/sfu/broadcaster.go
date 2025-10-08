package sfu

import (
	"fmt"
	"log"
	"sync"

	"github.com/pion/webrtc/v3"
)

type Broadcaster interface {
	AddSink(id string, writer *webrtc.TrackLocalStaticRTP)
	// TODO: Remove sink, graceful cleanup
}

type defaultBroadcaster struct {
	src   *webrtc.TrackRemote
	sinks map[string]*webrtc.TrackLocalStaticRTP
	mu    sync.RWMutex
}

func InitBroadcaster(src *webrtc.TrackRemote) Broadcaster {
	b := &defaultBroadcaster{
		src:   src,
		sinks: map[string]*webrtc.TrackLocalStaticRTP{},
	}

	go b.start()
	return b
}

func (b *defaultBroadcaster) AddSink(id string, writer *webrtc.TrackLocalStaticRTP) {
	b.mu.Lock()
	fmt.Println("Adding sink", id)
	b.sinks[id] = writer
	b.mu.Unlock()
}

func (b *defaultBroadcaster) start() {
	for {
		packet, _, err := b.src.ReadRTP()
		if err != nil {
			log.Printf("broadcaster closed: %v", err)
			return
		}

		b.mu.RLock()
		for id, sink := range b.sinks {
			if err := sink.WriteRTP(packet); err != nil {
				log.Printf("sink %s write failed: %v", id, err)
			}
		}
		b.mu.RUnlock()
	}
}
