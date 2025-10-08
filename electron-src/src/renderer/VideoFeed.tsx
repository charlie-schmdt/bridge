import { useContext, useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useVideoFeedContext, VideoFeedContext } from './contexts/VideoFeedContext';
interface SignalMessage {
  //write a new interface
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export default function VideoFeed() {
    const VF = useVideoFeedContext();
    const pc = useRef<RTCPeerConnection | null>(null);
    const stream = useRef<MediaStream | null>(null);
    const ignoreOfferRef = useRef(false);
    const isSettingRemoteAnswerPendingRef = useRef(false);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const socketUrl = 'ws://localhost:3000';
    console.log("VideoFeed rendered");


    const {
      sendJsonMessage,
      lastJsonMessage,
    } = useWebSocket<SignalMessage>(socketUrl, {
      onOpen: () => {
        console.log('WebSocket connected');
      },
      onMessage: (event) => {
        console.log('Event Recorded -- ', event);
      },
      onClose: () => {
        console.log('WebSocket disconnected');
      },
      onError: () => {
        console.log('Error in WebSocket connection');
      },
      shouldReconnect: (closeEvent) => true,
    });
    

    //const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        (async () => {
          console.log("Setting up media and peer connection...");
          
          //Capture local media
          try {
            stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true});
            VF.videoRef.current.srcObject = stream.current;
            
            // Disable tracks if the user wanted them off initially
            stream.current.getVideoTracks().forEach(track => track.enabled = VF.isVideoEnabled);
            stream.current.getAudioTracks().forEach(track => track.enabled = VF.isAudioEnabled);
            console.log("Got Media Stream:", stream.current);
          } catch (error) {
            console.error("Error accessing media devices.", error);
          }

          const config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          };
          console.log("Creating Peer Connection with config:", config);
          
          pc.current = new RTCPeerConnection(config);
          stream.current.getTracks().forEach(track => {
            pc.current?.addTrack(track, stream.current);
          });
          console.log("Peer Connection created:", pc.current);

          //Create an offer and set local description
          let makingOffer = false;
          pc.current.onnegotiationneeded = async () => {
            try {
              makingOffer = true;
              if (!pc.current) throw new Error("RTCPeerConnection not ready");
              const offer = await pc.current?.createOffer();
              await pc.current?.setLocalDescription(offer);
              console.log("Local description set:", pc.current?.localDescription);
              sendJsonMessage({
                type: "offer",
                payload: offer.sdp,
              });
              console.log("Sent offer:", pc.current.localDescription?.sdp);
            } catch (err) {
              console.error(err);
            } finally {
              makingOffer = false;
            }
          };

          //ask STUN server to generate ice cantidates

          pc.current.onicecandidate = (event) => {
            if (event.candidate) {
              console.log("New ICE candidate:", event.candidate);
              sendJsonMessage({ 
                type:"ice-candidate",
                payload: event.candidate.toJSON() 
              });
            }
            else{
              console.log("All ICE candidates have been sent");
            }
          };

        })();

         // Cleanup on unmount
        return () => {
          console.log("Cleaning up...");
          stream.current?.getTracks().forEach(track => track.stop());
          pc.current?.close();
        };
    }, []);

    useEffect(() => {
        (async () => {
          console.log("Display Local Video...");

          // Disable tracks if the user wanted them off initially
          stream.current?.getVideoTracks().forEach(track => track.enabled = VF.isVideoEnabled);
          stream.current?.getAudioTracks().forEach(track => track.enabled = VF.isAudioEnabled);
          //}

        })();

         // Cleanup on unmount
        return () => {
          console.log("Cleaning up video...");
        };
    }, [VF.isAudioEnabled, VF.isVideoEnabled]);


    

    useEffect(() => {
          //handling incoming messages from signaling channel

          //wait for answer and set remote description

          if (!lastJsonMessage) return;

          const message = lastJsonMessage;
          const polite = true; // Assume this client is polite for simplicity

          (async () => {
            try {
              if (message.type) {
                const readyForOffer =
                  (pc.current.signalingState === "stable" || isSettingRemoteAnswerPendingRef.current)
                const offerCollision =
                  description.type === "offer" && !readyForOffer;

                ignoreOfferRef.current = !polite && offerCollision;
                if (ignoreOfferRef.current) return;

                if (offerCollision && polite) {
                // Resolve glare
                  await pc.current.setLocalDescription({ type: "rollback" });
                }

                isSettingRemoteAnswerPendingRef.current = description.type === "answer";
                await pc.current.setRemoteDescription(description);
                isSettingRemoteAnswerPendingRef.current = false;

                if (description.type === "offer") {
                  const answer = await pc.current.createAnswer();
                  await pc.current?.setLocalDescription(answer);
                  sendJsonMessage({
                    type: "answer", 
                    payload: answer.sdp 
                  });
                }
              } else if (candidate) {
                try {
                  await pc.current.addIceCandidate(candidate);
                } catch (err) {
                  if (!ignoreOfferRef.current) throw err;
                }
              }
            } catch (err) {
              console.error(err);
            }
          })();
        }, [lastJsonMessage]);
          
    return <video ref={VF.videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
    
}
