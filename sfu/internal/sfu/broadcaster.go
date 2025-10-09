package sfu

import (
	"fmt"
	"log"
	"sync"

	"github.com/pion/webrtc/v3"
)

type Broadcaster interface {
	AddSink(id string, pc *webrtc.PeerConnection)
	RemoveSink(id string)
	Close()
}

type defaultBroadcaster struct {
	src   *webrtc.TrackRemote
	sinks map[string]*webrtc.TrackLocalStaticRTP
	stop  chan struct{}
	done  chan struct{}
	mu    sync.RWMutex
}

func InitBroadcaster(src *webrtc.TrackRemote) Broadcaster {
	b := &defaultBroadcaster{
		src:   src,
		sinks: map[string]*webrtc.TrackLocalStaticRTP{},
		stop:  make(chan struct{}),
		done:  make(chan struct{}),
	}

	go b.start()
	return b
}

func (b *defaultBroadcaster) AddSink(id string, pc *webrtc.PeerConnection) {

	localTrack, err := webrtc.NewTrackLocalStaticRTP(b.src.Codec().RTPCodecCapability, b.src.ID(), b.src.StreamID())
	if err != nil {
		fmt.Printf("failed to create local track: %s", err)
	}
	//var sender *webrtc.RTPSender
	//for _, transceiver := range pc.GetTransceivers() {
	//	if transceiver.Direction() == webrtc.RTPTransceiverDirectionSendonly {
	//		sender = transceiver.Sender()
	//		break
	//	}
	//}
	//sender.ReplaceTrack(localTrack)
	_, err = pc.AddTrack(localTrack)
	fmt.Println("Track added for id: ", id)
	if err != nil {
		fmt.Printf("failed to add track to PeerConnection: %s", err)
	}

	fmt.Println("Adding sink", id)
	b.mu.Lock()
	b.sinks[id] = localTrack
	b.mu.Unlock()
}

func (b *defaultBroadcaster) RemoveSink(id string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.sinks, id)
}

func (b *defaultBroadcaster) Close() {
	close(b.stop)
	//<-b.done
}

func (b *defaultBroadcaster) start() {
	defer close(b.done)
	for {
		select {
		case <-b.stop:
			// Exit the goroutine
			log.Println("Exiting broadcast goroutine")
			return
		default:
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
}
