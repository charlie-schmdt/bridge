package sfu

import (
	"fmt"
	"log"
	"sync"

	"github.com/pion/rtcp"
	"github.com/pion/webrtc/v3"
)

type Broadcaster interface {
	SendAllPublisherPli()
	AddVideoSink(id string, pc *webrtc.PeerConnection)
	AddAudioSink(id string, pc *webrtc.PeerConnection)
	RemoveSinks(id string)
	Close(closeSubscriber func(id string))
	SetVideoSource(videoSrc *webrtc.TrackRemote)
	SetAudioSource(audioSrc *webrtc.TrackRemote)
	SetScreenSource(screenSrc *webrtc.TrackRemote)
}

type defaultBroadcaster struct {
	id          string
	pc          *webrtc.PeerConnection
	videoSrc    *webrtc.TrackRemote
	videoSinks  map[string]*webrtc.TrackLocalStaticRTP
	audioSrc    *webrtc.TrackRemote
	audioSinks  map[string]*webrtc.TrackLocalStaticRTP
	screenSrc   *webrtc.TrackRemote
	screenSinks map[string]*webrtc.TrackLocalStaticRTP
	vstop       chan struct{}
	vdone       chan struct{}
	astop       chan struct{}
	adone       chan struct{}
	sstop       chan struct{}
	sdone       chan struct{}

	vmu sync.RWMutex
	amu sync.RWMutex
	smu sync.RWMutex
}

func InitBroadcaster(id string, pc *webrtc.PeerConnection, videoSrc, audioSrc, screenSrc *webrtc.TrackRemote) Broadcaster {
	b := &defaultBroadcaster{
		id:          id,
		pc:          pc,
		videoSrc:    videoSrc,
		videoSinks:  map[string]*webrtc.TrackLocalStaticRTP{},
		audioSrc:    audioSrc,
		audioSinks:  map[string]*webrtc.TrackLocalStaticRTP{},
		screenSrc:   screenSrc,
		screenSinks: map[string]*webrtc.TrackLocalStaticRTP{},
		vstop:       make(chan struct{}),
		vdone:       make(chan struct{}),
		astop:       make(chan struct{}),
		adone:       make(chan struct{}),
		sstop:       make(chan struct{}),
		sdone:       make(chan struct{}),
	}

	go b.startVideo()
	go b.startAudio()
	go b.startScreenShare()
	return b
}

func (b *defaultBroadcaster) SendAllPublisherPli() {
	if b.videoSrc != nil {
		b.sendPublisherPli(b.videoSrc)
	}
	if b.screenSrc != nil {
		b.sendPublisherPli(b.screenSrc)
	}
}

func (b *defaultBroadcaster) sendPublisherPli(rtpSource *webrtc.TrackRemote) {
	if b.pc == nil || rtpSource == nil {
		log.Printf("Cannot send PLI: publisher PC or video source is nil")
		return
	}

	// pc MUST match the id of the broadcaster (sending PLI for this videoSrc through pc)
	pli := &rtcp.PictureLossIndication{
		MediaSSRC: uint32(rtpSource.SSRC()),
	}

	log.Printf("Sending PLI to publisher for MediaSSRC %d", pli.MediaSSRC)
	if err := b.pc.WriteRTCP([]rtcp.Packet{pli}); err != nil {
		log.Printf("Failed to write PLI: %v", err)
	}
}

func (b *defaultBroadcaster) readSubscriberRTCP(rtpSender *webrtc.RTPSender, rtpSource *webrtc.TrackRemote) {
	for {
		packets, _, err := rtpSender.ReadRTCP()
		if err != nil {
			return // Connection closed?
		}
		for _, pkt := range packets {
			if _, ok := pkt.(*rtcp.PictureLossIndication); ok {
				log.Println("Received PLI from subscriber")
				b.sendPublisherPli(rtpSource)
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

func (b *defaultBroadcaster) SetScreenSource(screenSrc *webrtc.TrackRemote) {
	b.screenSrc = screenSrc
}

func (b *defaultBroadcaster) AddVideoSink(id string, pc *webrtc.PeerConnection) {

	if b.videoSrc == nil {
		return
	}
	// Create new localTrack as a sink for the receiver if sink doesn't already exist
	// Use the broadcaster's clientID as the streamID
	if _, exists := b.videoSinks[id]; !exists {
		localTrack, err := webrtc.NewTrackLocalStaticRTP(b.videoSrc.Codec().RTPCodecCapability, b.videoSrc.ID(), b.id)
		if err != nil {
			fmt.Printf("failed to create local track: %s", err)
		}
		rtpSender, err := pc.AddTransceiverFromTrack(localTrack, webrtc.RTPTransceiverInit{
			Direction: webrtc.RTPTransceiverDirectionSendonly,
		})
		if err != nil {
			fmt.Printf("failed to add track to PeerConnection: %s", err)
		}
		fmt.Println("Track added for id: ", id)
		fmt.Println("Adding sink", id)
		b.vmu.Lock()
		b.videoSinks[id] = localTrack
		b.vmu.Unlock()
		go b.readSubscriberRTCP(rtpSender.Sender(), b.videoSrc)
	}

	// Create a new localTrack as a sink for the receiver if screenSrc is not nil
	if b.screenSrc == nil {
		return
	}
	if _, exists := b.screenSinks[id]; !exists {
		localScreenTrack, err := webrtc.NewTrackLocalStaticRTP(b.screenSrc.Codec().RTPCodecCapability, b.screenSrc.ID(), b.id+"-screen")
		if err != nil {
			fmt.Printf("failed to create local track: %s", err)
		}
		rtpScreenSender, err := pc.AddTransceiverFromTrack(localScreenTrack, webrtc.RTPTransceiverInit{
			Direction: webrtc.RTPTransceiverDirectionSendonly,
		})
		if err != nil {
			fmt.Printf("failed to add track to PeerConnection: %s", err)
		}
		fmt.Println("Track added for id: ", id)
		fmt.Println("Adding screen sink", id)
		b.smu.Lock()
		b.screenSinks[id] = localScreenTrack
		b.smu.Unlock()
		go b.readSubscriberRTCP(rtpScreenSender.Sender(), b.screenSrc)
	}
}

func (b *defaultBroadcaster) AddAudioSink(id string, pc *webrtc.PeerConnection) {
	if b.audioSrc == nil {
		return
	}
	localTrack, err := webrtc.NewTrackLocalStaticRTP(b.audioSrc.Codec().RTPCodecCapability, b.audioSrc.ID(), b.id)
	if err != nil {
		fmt.Printf("failed to create local audio track: %s", err)
	}

	_, err = pc.AddTransceiverFromTrack(localTrack, webrtc.RTPTransceiverInit{
		Direction: webrtc.RTPTransceiverDirectionSendonly,
	})
	if err != nil {
		fmt.Printf("failed to add track to PeerConnection: %s", err)
	}
	fmt.Println("Audio track added for id: ", id)

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
	close(b.sstop)

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

func (b *defaultBroadcaster) startScreenShare() {
	defer close(b.sdone)
	for {
		select {
		case <-b.sstop:
			// Exit the goroutine
			log.Println("Exiting broadcast goroutine")
			return
		default:
			if b.screenSrc == nil {
				continue
			}
			packet, _, err := b.screenSrc.ReadRTP()
			if err != nil {
				log.Printf("broadcaster closed: %v", err)
				return
			}

			b.smu.RLock()
			for id, sink := range b.screenSinks {
				if err := sink.WriteRTP(packet); err != nil {
					log.Printf("sink %s write failed: %v", id, err)
				}
			}
			b.smu.RUnlock()
		}
	}
}
