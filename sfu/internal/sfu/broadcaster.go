package sfu

import (
	"fmt"
	"log"
	"sync"

	"github.com/pion/webrtc/v3"
)

type Broadcaster interface {
	AddVideoSink(id string, pc *webrtc.PeerConnection)
	AddAudioSink(id string, pc *webrtc.PeerConnection)
	RemoveSinks(id string)
	Close(closeSubscriber func(id string))
}

type defaultBroadcaster struct {
	videoSrc   *webrtc.TrackRemote
	videoSinks map[string]*webrtc.TrackLocalStaticRTP
	audioSrc   *webrtc.TrackRemote
	audioSinks map[string]*webrtc.TrackLocalStaticRTP
	vstop      chan struct{}
	vdone      chan struct{}
	astop      chan struct{}
	adone      chan struct{}

	vmu sync.RWMutex
	amu sync.RWMutex
}

func InitBroadcaster(videoSrc *webrtc.TrackRemote, audioSrc *webrtc.TrackRemote) Broadcaster {
	b := &defaultBroadcaster{
		videoSrc:   videoSrc,
		videoSinks: map[string]*webrtc.TrackLocalStaticRTP{},
		audioSrc:   videoSrc,
		audioSinks: map[string]*webrtc.TrackLocalStaticRTP{},
		vstop:      make(chan struct{}),
		vdone:      make(chan struct{}),
		astop:      make(chan struct{}),
		adone:      make(chan struct{}),
	}

	go b.startVideo()
	go b.startAudio()
	return b
}

func (b *defaultBroadcaster) AddVideoSink(id string, pc *webrtc.PeerConnection) {

	localTrack, err := webrtc.NewTrackLocalStaticRTP(b.videoSrc.Codec().RTPCodecCapability, b.videoSrc.ID(), b.videoSrc.StreamID())
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
	b.vmu.Lock()
	b.videoSinks[id] = localTrack
	b.vmu.Unlock()
}

func (b *defaultBroadcaster) AddAudioSink(id string, pc *webrtc.PeerConnection) {
	localTrack, err := webrtc.NewTrackLocalStaticRTP(b.audioSrc.Codec().RTPCodecCapability, b.audioSrc.ID(), b.audioSrc.StreamID())
	if err != nil {
		fmt.Printf("failed to create local audio track: %s", err)
	}

	_, err = pc.AddTrack(localTrack)
	fmt.Println("Audio track added for id: ", id)
	if err != nil {
		fmt.Printf("failed to add track to PeerConnection: %s", err)
	}

	fmt.Println("Adding sink", id)
	b.amu.Lock()
	b.videoSinks[id] = localTrack
	b.amu.Unlock()
}

func (b *defaultBroadcaster) RemoveSinks(id string) {
	b.vmu.Lock()
	delete(b.videoSinks, id)
	b.vmu.Unlock()
	b.amu.Lock()
	delete(b.audioSinks, id)
	b.amu.Unlock()
}

func (b *defaultBroadcaster) Close(closeSubscriber func(id string)) {
	close(b.vstop)
	close(b.astop)

	// Send out the peerClose signal to all subscribers
	for id := range b.videoSinks {
		closeSubscriber(id)
	}
	for id := range b.audioSinks {
		closeSubscriber(id)
	}
	//<-b.done
}

func (b *defaultBroadcaster) startVideo() {
	defer close(b.vdone)
	for {
		select {
		case <-b.vstop:
			// Exit the goroutine
			log.Println("Exiting broadcast goroutine")
			return
		default:
			packet, _, err := b.videoSrc.ReadRTP()
			if err != nil {
				log.Printf("broadcaster closed: %v", err)
				return
			}

			b.vmu.RLock()
			for id, sink := range b.videoSinks {
				if err := sink.WriteRTP(packet); err != nil {
					log.Printf("sink %s write failed: %v", id, err)
				}
			}
			b.vmu.RUnlock()
		}
	}
}

func (b *defaultBroadcaster) startAudio() {
	defer close(b.adone)
	for {
		select {
		case <-b.astop:
			// Exit the goroutine
			log.Println("Exiting broadcast goroutine")
			return
		default:
			packet, _, err := b.audioSrc.ReadRTP()
			if err != nil {
				log.Printf("broadcaster closed: %v", err)
				return
			}

			b.amu.RLock()
			for id, sink := range b.audioSinks {
				if err := sink.WriteRTP(packet); err != nil {
					log.Printf("sink %s write failed: %v", id, err)
				}
			}
			b.amu.RUnlock()
		}
	}
}
