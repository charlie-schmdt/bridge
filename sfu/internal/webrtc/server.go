package webrtc

import (
	"encoding/json"
	"fmt"
	"log"
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
	writer  Writer
	routers map[string]sfu.Router
}

func HandleSession(w http.ResponseWriter, r *http.Request) {
	// Upgrade the HTTP connection to a websocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		panic(fmt.Sprintln("failed to upgrade connection:", err))
	}

	// Create writer
	writer := CreateWriter(conn)
	defer writer.Close()

	// Handle the signaling session
	sess := createSession(writer)
	for {
		var msg signaling.SignalMessage
		if err = conn.ReadJSON(&msg); err != nil {
			fmt.Println("read:", err)
			break
		}

		if msg.ClientID == "" {
			panic("Client ID is empty")
		}
		if msg.RoomID == "" {
			panic("Room ID is empty")
		}

		// Get the router for the room, create one if it doesn't exist
		roomRouter, exists := sess.routers[msg.RoomID]
		if !exists {
			roomRouter = sfu.NewRouter()
			sess.routers[msg.RoomID] = roomRouter
		}

		fmt.Println("Received message type:", msg.Type)

		switch msg.Type {
		case signaling.SignalMessageTypeJoin:
			log.Printf("Received Join request for room %s", msg.RoomID)
			// Create offer for the client
			var join signaling.Join
			if err := json.Unmarshal(msg.Payload, &join); err != nil {
				log.Printf("Failed to unmarshal join payload: %v", err)
				continue
			}
			pc, err := sess.handleJoin(writer, msg.RoomID, msg.ClientID)
			if err != nil {
				panic(fmt.Sprintf("failed to handle join: %v", err))
			}

			// Register the PeerConnection with the router
			log.Println("name: " + join.Name)
			err = roomRouter.AddPeerConnection(msg.ClientID, join.Name, pc)
			if err != nil {
				panic(fmt.Sprintf("failed to add PeerConnection to router: %v", err))
			}

		case signaling.SignalMessageTypeExit:
			fmt.Println("Message type exit receiver")
			// Unregister the client
			var exit signaling.Exit
			if err := json.Unmarshal(msg.Payload, &exit); err != nil {
				log.Printf("Failed to unmarshal exit payload: %v", err)
				continue
			}
			// TODO: Handle room-based exits, return error to client??
			sess.handleExit(msg.ClientID, msg.RoomID, exit.PeerName)

		case signaling.SignalMessageTypeOffer:
			var offer signaling.SdpOffer
			if err := json.Unmarshal(msg.Payload, &offer); err != nil {
				panic(fmt.Sprintf("failed to unmarshal offer: %s, %v", msg.Payload, err))
			}
			pc, isNew, err := sess.handleOffer(writer, msg.ClientID, msg.RoomID, &offer)
			if err != nil {
				panic(fmt.Sprintf("failed to handle offer: %v", err))
			}
			// Register the PeerConnection with the router
			if isNew {
				err = roomRouter.AddPeerConnection(msg.ClientID, "UNKNOWN", pc)
				if err != nil {
					panic(fmt.Sprintf("failed to add PeerConnection to router: %v", err))
				}
			}

		case signaling.SignalMessageTypeAnswer:
			var answer signaling.SdpAnswer
			if err := json.Unmarshal(msg.Payload, &answer); err != nil {
				panic(fmt.Sprintf("failed to unmarshal answer: %s, %v", msg.Payload, err))
			}
			err := sess.handleAnswer(msg.ClientID, msg.RoomID, &answer)
			if err != nil {
				panic(fmt.Sprintf("failed to handle answer: %v", err))
			}

		case signaling.SignalMessageTypeCandidate:
			var candidate signaling.IceCandidate
			if err := json.Unmarshal(msg.Payload, &candidate); err != nil {
				panic(fmt.Sprintf("failed to unmarshal candidate: %s, %v", msg.Payload, err))
			}
			err := sess.handleRemoteCandidate(msg.ClientID, msg.RoomID, &candidate)
			if err != nil {
				fmt.Println("Error: failed to handle candidate: ", err)
			}

		case signaling.SignalMessageTypePLI:
			// Send PLI to all other publishers
			// Request Key Frames from other callers
			log.Printf("Received PLI request from client %s", msg.ClientID)
			roomRouter.RequestKeyFrames(msg.ClientID)

		default:
			// TODO: handle other message types
		}
	}
}

func createSession(writer Writer) *session {
	return &session{
		writer:  writer,
		routers: make(map[string]sfu.Router),
	}
}

func (s *session) handleJoin(writer Writer, roomId string, id string) (*webrtc.PeerConnection, error) {
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
			{
				URLs: []string{"stun:global.stun.twilio.com:3478"},
			},
		},
	}
	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create PeerConnection: %w", err)
	}

	//for range 1 {
	//	pc.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
	//		Direction: webrtc.RTPTransceiverDirectionSendonly,
	//	})
	//}
	pc.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo, webrtc.RTPTransceiverInit{
		Direction: webrtc.RTPTransceiverDirectionRecvonly,
	})
	pc.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio, webrtc.RTPTransceiverInit{
		Direction: webrtc.RTPTransceiverDirectionRecvonly,
	})

	//offer, err := pc.CreateOffer(nil)
	//if err != nil {
	//	return nil, fmt.Errorf("failed to create offer: %w", err)
	//}

	//err = pc.SetLocalDescription(offer)
	//if err != nil {
	//	return nil, fmt.Errorf("failed to set local description: %w", err)
	//}

	s.registerConnectionHandlers(id, roomId, pc)

	//payload, _ := json.Marshal(signaling.SdpOffer{SDP: offer.SDP})
	//writer.WriteJSON(signaling.SignalMessage{
	//	Type:     signaling.SignalMessageTypeOffer,
	//	ClientID: id,
	//	Payload:  payload,
	//})
	return pc, nil
}

func (s *session) handleExit(id, roomId, name string) {

	// TODO: implement specific close messages, not a generic without specifying who to close
	if name == "" {
		// No provided name in exit message (or abrupt disconnect), get name from router
		name = s.routers[roomId].GetName(id)
	}
	closeSubscriber := func(peerId string) {
		payload, err := json.Marshal(signaling.PeerExit{PeerID: id, PeerName: name})
		if err != nil {
			log.Printf("Error marshaling the PeerExit payload for peer %s", peerId)
		}
		s.writer.WriteJSON(signaling.SignalMessage{
			Type:     signaling.SignalMessageTypePeerExit,
			ClientID: peerId,
			Payload:  payload,
		})
	}

	err := s.routers[roomId].RemovePeerConnection(id, closeSubscriber)
	if err != nil {
		fmt.Printf("Error removing connection %s: %v\n", id, err)
	} else {
		fmt.Printf("Connection %s removed successfully\n", id)
	}
}

func (s *session) handleOffer(writer Writer, id string, roomId string, offer *signaling.SdpOffer) (*webrtc.PeerConnection, bool, error) {
	// Create a new PeerConnection if one does not exist for the user
	isNew := false
	pc := s.routers[roomId].GetPeerConnection(id)
	if pc != nil {
		isNew = true
		config := webrtc.Configuration{}
		newPc, err := webrtc.NewPeerConnection(config)
		if err != nil {
			return nil, isNew, fmt.Errorf("failed to create PeerConnection: %w", err)
		}
		pc = newPc
	}

	// Set the remote description using the provided SDP offer
	sessionDescription := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  offer.SDP,
	}
	err := pc.SetRemoteDescription(sessionDescription)
	if err != nil {
		return nil, isNew, fmt.Errorf("failed to set remote description: %w", err)
	}

	// Create an answer
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		return nil, isNew, fmt.Errorf("failed to create answer: %w", err)
	}

	// Set the local description
	err = pc.SetLocalDescription(answer)
	if err != nil {
		return nil, isNew, fmt.Errorf("failed to set local description: %w", err)
	}

	// Register connection handlers only if PeerConnection is new
	if isNew {
		s.registerConnectionHandlers(id, roomId, pc)
	}

	// Send the answer back to the client
	payload, _ := json.Marshal(signaling.SdpAnswer{SDP: answer.SDP})
	writer.WriteJSON(signaling.SignalMessage{
		Type:     signaling.SignalMessageTypeAnswer,
		ClientID: id,
		Payload:  payload,
	})

	return pc, isNew, nil
}

func (s *session) handleAnswer(id string, roomId string, answer *signaling.SdpAnswer) error {
	pc := s.routers[roomId].GetPeerConnection(id)
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

func (s *session) registerConnectionHandlers(id string, roomId string, pc *webrtc.PeerConnection) {
	// Register negotiation needed
	pc.OnNegotiationNeeded(func() {
		fmt.Println("Negotiation needed for client " + id)
		offer, err := pc.CreateOffer(nil)
		if err != nil {
			fmt.Printf("Failed to create offer: %v\n", err)
			return
		}

		err = pc.SetLocalDescription(offer)
		if err != nil {
			fmt.Printf("Failed to set local description: %v\n", err)
			return
		}

		payload, _ := json.Marshal(signaling.SdpOffer{SDP: offer.SDP})
		s.writer.WriteJSON(signaling.SignalMessage{
			Type:     signaling.SignalMessageTypeOffer,
			ClientID: id,
			Payload:  payload,
		})
	})

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
			// TODO: implement reconnection attempt on disconnect, then cleanup PeerConnection on failure
			fmt.Println("ICE connection state change: ", state)
		}
	})

	// Register the connection state handler
	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		switch state {
		case webrtc.PeerConnectionStateConnected:
			fmt.Println("PeerConnection is connected")

			// Set the track handler
			pc.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
				fmt.Printf("New incoming track: kind=%s, ssrc=%d\n", track.Kind(), track.SSRC())

				if track.Kind() == webrtc.RTPCodecTypeVideo {
					// Forward video track to all other clients
					err := s.routers[roomId].ForwardVideoTrack(id, track)
					if err != nil {
						panic(fmt.Sprintf("failed to forward video track: %v", err))
					}
				} else if track.Kind() == webrtc.RTPCodecTypeAudio {
					// Forward audio track to all other clients
					err := s.routers[roomId].ForwardAudioTrack(id, track)
					if err != nil {
						panic(fmt.Sprintf("failed to forward audio track: %v", err))
					}
				} else {
					fmt.Println("Received non-video/audio track")
				}

			})

		case webrtc.PeerConnectionStateFailed:
			// send a peerExit to all peers
			s.handleExit(id, roomId, "")

		default:
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

func (s *session) handleRemoteCandidate(id string, roomId string, candidate *signaling.IceCandidate) error {
	// Add the ICE candidate to the PeerConnection
	iceCandidate := webrtc.ICECandidateInit{
		Candidate: candidate.Candidate,
	}
	clientPC := s.routers[roomId].GetPeerConnection(id)
	if clientPC == nil {
		return fmt.Errorf("PeerConnection with id %s does not exist", id)
	}
	err := clientPC.AddICECandidate(iceCandidate)
	if err != nil {
		return fmt.Errorf("failed to add ICE candidate: %w", err)
	}
	return nil
}
