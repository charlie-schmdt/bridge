package webrtc

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sfu/internal/sfu"
	"sfu/internal/signaling"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type session struct {
	writer Writer
	router sfu.Router
}

func HandleSession(w http.ResponseWriter, r *http.Request, router sfu.Router) {
	// Upgrade the HTTP connection to a websocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		panic(fmt.Sprintln("failed to upgrade connection:", err))
	}

	// Create writer
	writer := CreateWriter(conn)
	defer writer.Close()

	// Handle the signaling session
	sess := createSession(writer, router)
	for {
		var msg signaling.SignalMessage
		if err = conn.ReadJSON(&msg); err != nil {
			fmt.Println("read:", err)
			break
		}

		if msg.ClientID == "" {
			panic("Client ID is empty")
		}

		fmt.Println("Received message type:", msg.Type)

		switch msg.Type {
		case signaling.SignalMessageTypeJoin:
			// Create offer for the client
			pc, err := sess.handleJoin(writer, msg.ClientID)
			if err != nil {
				panic(fmt.Sprintf("failed to handle join: %v", err))
			}

			// Register the PeerConnection with the router
			err = router.AddPeerConnection(msg.ClientID, pc)
			if err != nil {
				panic(fmt.Sprintf("failed to add PeerConnection to router: %v", err))
			}

		case signaling.SignalMessageTypeOffer:
			var offer signaling.SdpOffer
			if err := json.Unmarshal(msg.Payload, &offer); err != nil {
				panic(fmt.Sprintf("failed to unmarshal offer: %s, %v", msg.Payload, err))
			}
			pc, err := sess.handleOffer(writer, msg.ClientID, &offer)
			if err != nil {
				panic(fmt.Sprintf("failed to handle offer: %v", err))
			}
			// Register the PeerConnection with the router
			err = router.AddPeerConnection(msg.ClientID, pc)
			if err != nil {
				panic(fmt.Sprintf("failed to add PeerConnection to router: %v", err))
			}

		case signaling.SignalMessageTypeAnswer:
			var answer signaling.SdpAnswer
			if err := json.Unmarshal(msg.Payload, &answer); err != nil {
				panic(fmt.Sprintf("failed to unmarshal answer: %s, %v", msg.Payload, err))
			}
			err := sess.handleAnswer(msg.ClientID, &answer)
			if err != nil {
				panic(fmt.Sprintf("failed to handle answer: %v", err))
			}

		case signaling.SignalMessageTypeCandidate:
			var candidate signaling.IceCandidate
			if err := json.Unmarshal(msg.Payload, &candidate); err != nil {
				panic(fmt.Sprintf("failed to unmarshal candidate: %s, %v", msg.Payload, err))
			}
			err := sess.handleRemoteCandidate(msg.ClientID, &candidate)
			if err != nil {
				fmt.Println("Error: failed to handle candidate: ", err)
			}

		default:
			// TODO: handle other message types
		}
	}
}

func createSession(writer Writer, router sfu.Router) *session {
	return &session{
		writer: writer,
		router: router,
	}
}

func (s *session) handleJoin(writer Writer, id string) (*webrtc.PeerConnection, error) {
	pc, err := webrtc.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
	}

	for range 1 {
		pc.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
			Direction: webrtc.RTPTransceiverDirectionSendonly,
		})
	}
	pc.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
		Direction: webrtc.RTPTransceiverDirectionRecvonly,
	})

	offer, err := pc.CreateOffer(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create offer: %w", err)
	}

	err = pc.SetLocalDescription(offer)
	if err != nil {
		return nil, fmt.Errorf("failed to set local description: %w", err)
	}

	s.registerConnectionHandlers(id, pc)

	payload, _ := json.Marshal(signaling.SdpOffer{SDP: offer.SDP})
	writer.WriteJSON(signaling.SignalMessage{
		Type:     signaling.SignalMessageTypeOffer,
		ClientID: id,
		Payload:  payload,
	})
	return pc, nil
}

func (s *session) handleOffer(writer Writer, id string, offer *signaling.SdpOffer) (*webrtc.PeerConnection, error) {
	// Create a new PeerConnection
	config := webrtc.Configuration{}
	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
	}

	// Set the remote description using the provided SDP offer
	sessionDescription := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  offer.SDP,
	}
	err = pc.SetRemoteDescription(sessionDescription)
	if err != nil {
		return nil, fmt.Errorf("failed to set remote description: %w", err)
	}

	for range 5 {
		pc.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
			Direction: webrtc.RTPTransceiverDirectionSendonly,
		})
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

	s.registerConnectionHandlers(id, pc)

	// Send the answer back to the client
	payload, _ := json.Marshal(signaling.SdpAnswer{SDP: answer.SDP})
	writer.WriteJSON(signaling.SignalMessage{
		Type:     signaling.SignalMessageTypeAnswer,
		ClientID: id,
		Payload:  payload,
	})

	return pc, nil
}

func (s *session) handleAnswer(id string, answer *signaling.SdpAnswer) error {
	pc := s.router.GetPeerConnection(id)
	if pc == nil {
		return fmt.Errorf("PeerConnection with id %s does not exist", id)
	}

	// Set the remote description
	sessionDescription := webrtc.SessionDescription{
		Type: webrtc.SDPTypeAnswer,
		SDP:  answer.SDP,
	}
	err := pc.SetRemoteDescription(sessionDescription)
	if err != nil {
		return fmt.Errorf("failed to set remote description: %w", err)
	}
	return nil
}

func (s *session) registerConnectionHandlers(id string, pc *webrtc.PeerConnection) {
	// Register the ICE candidate handler
	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			return
		}
		s.handleLocalCandidate(id, c)
	})

	// Register the ICE connection state handler (wait for ICE connection)
	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		if state == webrtc.ICEConnectionStateConnected {
			// ICE connection is ready, wait for data channels
			fmt.Println("ICE connection is ready")
		} else {
			fmt.Println("ICE connection state change: ", state)
		}
	})

	// Register the connection state handler
	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		if state == webrtc.PeerConnectionStateConnected {
			fmt.Println("PeerConnection is connected")

			// Set the track handler
			pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
				fmt.Printf("New incoming track: kind=%s, ssrc=%d\n", track.Kind(), track.SSRC())

				if track.Kind() == webrtc.RTPCodecTypeVideo {
					// Forward video track to all other clients
					err := s.router.ForwardVideoTrack(id, track)
					if err != nil {
						panic(fmt.Sprintf("failed to forward video track: %v", err))
					}
				}
				// TODO: handle audio track

			})
		} else {
			// TODO: handle PeerConnection failure
			fmt.Println("PeerConnection state change: ", state)
		}
	})
}

func (s *session) handleLocalCandidate(id string, candidate *webrtc.ICECandidate) {
	// This function can be used to handle local ICE candidates, e.g., send them to the remote peer via signaling
	jsonCandidate := candidate.ToJSON()
	newCandidate := signaling.IceCandidate{Candidate: jsonCandidate.Candidate}
	if jsonCandidate.SDPMid != nil {
		newCandidate.SdpMid = *jsonCandidate.SDPMid
	}
	if jsonCandidate.SDPMLineIndex != nil {
		newCandidate.SdpMLineIndex = int(*jsonCandidate.SDPMLineIndex)
	}

	payload, _ := json.Marshal(newCandidate)
	pbCandidate := &signaling.SignalMessage{
		Type:     signaling.SignalMessageTypeCandidate,
		ClientID: id,
		Payload:  payload,
	}

	s.writer.WriteJSON(pbCandidate)
}

func (s *session) handleRemoteCandidate(id string, candidate *signaling.IceCandidate) error {
	// Add the ICE candidate to the PeerConnection
	iceCandidate := webrtc.ICECandidateInit{
		Candidate: candidate.Candidate,
	}
	clientPC := s.router.GetPeerConnection(id)
	if clientPC == nil {
		return fmt.Errorf("PeerConnection with id %s does not exist", id)
	}
	err := clientPC.AddICECandidate(iceCandidate)
	if err != nil {
		return fmt.Errorf("failed to add ICE candidate: %w", err)
	}
	return nil
}
