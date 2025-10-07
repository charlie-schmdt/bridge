import { useContext, useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { VideoFeedContext } from './contexts/VideoFeedContext';
interface SignalMessage {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export default function VideoFeed() {
    const VF = useContext(VideoFeedContext);
    const pc = useRef<RTCPeerConnection | null>(null);
    const stream = useRef<MediaStream | null>(null);
    const socketUrl = 'wss://localhost:3000';

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
          //Capture local media
          console.log("initMediaConnection called");
          stream.current = await navigator.mediaDevices.getUserMedia({ video: VF.isVideoEnabled, audio: VF.isAudioEnabled});

          // Display in local video element
          try {
            if (VF.videoRef.current) {
              VF.videoRef.current.srcObject = stream.current;
              VF.videoRef.current.play();
            }
          } catch (err) {
            console.error("Error accessing camera:", err);
          }
          const config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          };
    
          pc.current = new RTCPeerConnection(config);
          stream.current.getTracks().forEach(track => {
            pc.current?.addTrack(track, stream.current);
          });

          //Create an offer and set local description
          let makingOffer = false;
          pc.current.onnegotiationneeded = async () => {
            try {
              makingOffer = true;
              await pc.current?.setLocalDescription();
              sendJsonMessage({ description: pc.current?.localDescription });
            } catch (err) {
              console.error(err);
            } finally {
              makingOffer = false;
            }
          };

          //ask STUN server to generate ice cantidates

          pc.current.onicecandidate = ({ candidate }) => sendJsonMessage({ candidate });
        })();

         // Cleanup on unmount
        return () => {
          stream.current?.getTracks().forEach(track => track.stop());
          pc.current?.close();
        };
    }, []);

    useEffect(() => {
          //handling incoming messages from signaling channel

          let ignoreOffer = false;
          let isSettingRemoteAnswerPending = false;
          let polite = true;

          //wait for answer and set remote description

          if (!lastJsonMessage) return;

          const { description, candidate } = lastJsonMessage;

          (async () => {
            try {
              if (description) {
                const readyForOffer =
                  (pc.current.signalingState === "stable" || isSettingRemoteAnswerPending);
                const offerCollision =
                  description.type === "offer" && !readyForOffer;

                ignoreOffer = !polite && offerCollision;
                if (ignoreOffer) return;

                isSettingRemoteAnswerPending = description.type === "answer";
                await pc.current.setRemoteDescription(description);
                isSettingRemoteAnswerPending = false;

                if (description.type === "offer") {
                  await pc.current.setLocalDescription();
                  sendJsonMessage({ description: pc.current.localDescription });
                }
              } else if (candidate) {
                try {
                  await pc.current.addIceCandidate(candidate);
                } catch (err) {
                  if (!ignoreOffer) throw err;
                }
              }
            } catch (err) {
              console.error(err);
            }
          })();
        }, [lastJsonMessage]);
          
    return <video ref={VF.videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
    
}
