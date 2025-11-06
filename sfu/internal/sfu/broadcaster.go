package sfu

import (
	"fmt"
	"log"
	"sync"

	"github.com/pion/rtcp"
	"github.com/pion/webrtc/v3"
)

type Broadcaster interface {
	SendPublisherPli()
	AddVideoSink(id string, pc *webrtc.PeerConnection)
	AddAudioSink(id string, pc *webrtc.PeerConnection)
	RemoveSinks(id string)
	Close(closeSubscriber func(id string))
	SetVideoSource(videoSrc *webrtc.TrackRemote)
	SetAudioSource(audioSrc *webrtc.TrackRemote)
}

type defaultBroadcaster struct {
	pc         *webrtc.PeerConnection
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

func InitBroadcaster(pc *webrtc.PeerConnection, videoSrc *webrtc.TrackRemote, audioSrc *webrtc.TrackRemote) Broadcaster {
	b := &defaultBroadcaster{
		pc:         pc,
		videoSrc:   videoSrc,
		videoSinks: map[string]*webrtc.TrackLocalStaticRTP{},
		audioSrc:   audioSrc,
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

func (b *defaultBroadcaster) SendPublisherPli() {
	if b.pc == nil || b.videoSrc == nil {
		log.Printf("Cannot send PLI: publisher PC or video source is nil")
		return
	}

	// pc MUST match the id of the broadcaster (sending PLI for this videoSrc through pc)
	pli := &rtcp.PictureLossIndication{
		MediaSSRC: uint32(b.videoSrc.SSRC()),
	}

	log.Printf("Sending PLI to publisher for MediaSSRC %d", pli.MediaSSRC)
	if err := b.pc.WriteRTCP([]rtcp.Packet{pli}); err != nil {
		log.Printf("Failed to write PLI: %v", err)
	}
}

func (b *defaultBroadcaster) readSubscriberRTCP(rtpSender *webrtc.RTPSender) {
	for {
		packets, _, err := rtpSender.ReadRTCP()
		if err != nil {
			return // Connection closed?
		}
		for _, pkt := range packets {
			if _, ok := pkt.(*rtcp.PictureLossIndication); ok {
				log.Println("Received PLI from subscriber")
				b.SendPublisherPli()
			}
		}
	}
}

func (b *defaultBroadcaster) SetVideoSource(videoSrc *webrtc.TrackRemote) {
	b.videoSrc = videoSrc
}

func (b *defaultBroadcaster) SetAudioSource(audioSrc *webrtc.TrackRemote) {
	b.audioSrc = audioSrc
}

func (b *defaultBroadcaster) AddVideoSink(id string, pc *webrtc.PeerConnection) {

	if b.videoSrc == nil {
		return
	}
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
	rtpSender, err := pc.AddTrack(localTrack)
	fmt.Println("Track added for id: ", id)
	if err != nil {
		fmt.Printf("failed to add track to PeerConnection: %s", err)
	}

	fmt.Println("Adding sink", id)
	b.vmu.Lock()
	b.videoSinks[id] = localTrack
	b.vmu.Unlock()
	go b.readSubscriberRTCP(rtpSender)
}

func (b *defaultBroadcaster) AddAudioSink(id string, pc *webrtc.PeerConnection) {
	if b.audioSrc == nil {
		return
	}
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
	b.audioSinks[id] = localTrack
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
			if b.videoSrc == nil {
				continue
			}
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
			if b.audioSrc == nil {
				continue
			}
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
