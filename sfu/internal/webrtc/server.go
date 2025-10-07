package webrtc

import (
	"fmt"
	"io"
	"sfu/internal/sfu"
	pb "sfu/proto/sfu"

	"github.com/pion/webrtc/v3"
)

type SignalingServer interface {
	pb.SignalingServer
}

type defaultSignalingServer struct {
	pb.UnimplementedSignalingServer
	Router sfu.Router
}

type session struct {
	stream pb.Signaling_HandleSessionServer
	pc     *webrtc.PeerConnection
	id     string
}

func NewSignalingServer(router sfu.Router) SignalingServer {
	return &defaultSignalingServer{
		Router: router,
	}
}

func (s *defaultSignalingServer) HandleSession(stream pb.Signaling_HandleSessionServer) error {
	// Handle the signaling session
	sess := createSession(stream)
	for {
		in, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}

		switch payload := in.Payload.(type) {
		case *pb.SignalMessage_Offer:
			pc, err := handleOffer(stream, payload.Offer)
			if err != nil {
				panic(fmt.Sprintf("failed to handle offer: %v", err))
			}
			// Add the PeerConnection to the stream context for later use
			sess.pc = pc
			sess.id = "some-uuid-from-remote" // TODO: get this from remote peer

			// Add the PeerConnection to the router
			err = s.Router.AddPeerConnection(sess.id, sess.pc)
			if err != nil {
				panic(fmt.Sprintf("failed to add PeerConnection to router: %v", err))
			}

			sess.registerConnectionHandlers(s.Router)

		case *pb.SignalMessage_Candidate:
			err := sess.handleRemoteCandidate(payload.Candidate)
			if err != nil {
				panic(fmt.Sprintf("failed to handle candidate: %v", err))
			}

		default:
			// TODO: handle other message types
		}
	}
}

func createSession(stream pb.Signaling_HandleSessionServer) *session {
	return &session{
		stream: stream,
		id:     "",
		pc:     nil,
	}
}

func handleOffer(stream pb.Signaling_HandleSessionServer, offer *pb.SdpOffer) (*webrtc.PeerConnection, error) {
	// Create a new PeerConnection
	config := webrtc.Configuration{}
	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
	}

	// Set the remote description using the provided SDP offer
	sessionDescription := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  offer.Sdp,
	}
	err = pc.SetRemoteDescription(sessionDescription)
	if err != nil {
		return nil, fmt.Errorf("failed to set remote description: %w", err)
	}

	// Create an answer
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create answer: %w", err)
	}

	// Set the local description
	err = pc.SetLocalDescription(answer)
	if err != nil {
		return nil, fmt.Errorf("failed to set local description: %w", err)
	}

	// Send the answer back to the client
	err = stream.Send(&pb.SignalMessage{
		Payload: &pb.SignalMessage_Answer{
			Answer: &pb.SdpAnswer{
				Sdp: answer.SDP,
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to send answer: %w", err)
	}

	return pc, nil
}

func (s *session) registerConnectionHandlers(router sfu.Router) {
	// Register the ICE candidate handler
	s.pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		s.handleLocalCandidate(c)
	})

	// Register the ICE connection state handler (wait for ICE connection)
	s.pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		if state == webrtc.ICEConnectionStateConnected {
			// ICE connection is ready, wait for data channels
			fmt.Println("ICE connection is ready")
		} else {
			fmt.Println("ICE connection state change: ", state)
		}
	})

	// Register the connection state handler
	s.pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		if state == webrtc.PeerConnectionStateConnected {
			fmt.Println("PeerConnection is connected")

			// Set the track handler
			s.pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
				fmt.Printf("New incoming track: kind=%s, ssrc=%d\n", track.Kind(), track.SSRC())

				if track.Kind() == webrtc.RTPCodecTypeVideo {
					// Forward video track to all other clients
					router.ForwardVideoTrack(s.id, track)
				}
				// TODO: handle audio track

			})
		} else {
			// TODO: handle PeerConnection failure
			fmt.Println("PeerConnection state change: ", state)
		}
	})
}

func (s *session) handleLocalCandidate(candidate *webrtc.ICECandidate) {
	// This function can be used to handle local ICE candidates, e.g., send them to the remote peer via signaling
	pbCandidate := &pb.IceCandidate{
		Candidate: candidate.ToJSON().Candidate,
	}

	err := s.stream.Send(&pb.SignalMessage{
		Payload: &pb.SignalMessage_Candidate{
			Candidate: pbCandidate,
		},
	})
	if err != nil {
		// TODO: error handling
	}
}

func (s *session) handleRemoteCandidate(offer *pb.IceCandidate) error {
	// Add the ICE candidate to the PeerConnection
	iceCandidate := webrtc.ICECandidateInit{
		Candidate: offer.Candidate,
	}
	err := s.pc.AddICECandidate(iceCandidate)
	if err != nil {
		return fmt.Errorf("failed to add ICE candidate: %w", err)
	}
	return nil
}
