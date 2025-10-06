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

func NewSignalingServer(router sfu.Router) SignalingServer {
	return &defaultSignalingServer{
		Router: router,
	}
}

func (s *defaultSignalingServer) HandleSession(stream pb.Signaling_HandleSessionServer) error {
	// Handle the signaling session
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
			// Add the PeerConnection to the router
			err = s.Router.AddPeerConnection("some-unique-id", pc)
			if err != nil {
				panic(fmt.Sprintf("failed to add PeerConnection to router: %v", err))
			}

		case *pb.SignalMessage_Candidate:
			// TODO: handle ICE candidate
		default:
			// TODO: handle other message types
		}
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
