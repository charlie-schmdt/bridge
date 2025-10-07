import { useContext, useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { VideoFeedContext } from './contexts/VideoFeedContext';

export default function VideoFeed() {
    const VF = useContext(VideoFeedContext);
    const pc = useRef<RTCPeerConnection | null>(null);
    const socketUrl = 'wss://localhost:3000';

    //const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        async function initMediaConnection() {
          //Capture local media
          const stream = await navigator.mediaDevices.getUserMedia({ video: VF.isVideoEnabled, audio: VF.isAudioEnabled});

          // Display in local video element
          try {
            if (VF.videoRef.current) {
              VF.videoRef.current.srcObject = stream;
              VF.videoRef.current.play();
            }
          } catch (err) {
            console.error("Error accessing camera:", err);
          }

          const {sendMessage,sendJsonMessage,
            lastMessage,lastJsonMessage,
            readyState,getWebSocket,
          } = useWebSocket(socketUrl, {
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

          //Create RTC Peer Connection and add tracks
          const config = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          };
    
          pc.current = new RTCPeerConnection(config);
          stream.getTracks().forEach(track => {
            pc.current.addTrack(track, stream);
          });
          //Create an offer and set local description
          let makingOffer = false;
          pc.current.onnegotiationneeded = async () => {
            try {
              makingOffer = true;
              await pc.current.setLocalDescription();
              getWebSocket().send({ description: pc.localDescription });
            } catch (err) {
              console.error(err);
            } finally {
              makingOffer = false;
            }
          };

          //ask STUN server to generate ice cantidates

          pc.current.onicecandidate = ({ candidate }) => signaler.send({ candidate });

          //handling incoming messages from signaling channel

          let ignoreOffer = false;
          let isSettingRemoteAnswerPending = false;

          //wait for answer and set remote description


          signaler.onmessage = async ({ data: { description, candidate } }) => {
            try {
              if (description) {
                const readyForOffer =
                  !makingOffer &&
                  (pc.signalingState === "stable" || isSettingRemoteAnswerPending);
                const offerCollision = description.type === "offer" && !readyForOffer;

                ignoreOffer = !polite && offerCollision;
                if (ignoreOffer) {
                  return;
                }
                isSettingRemoteAnswerPending = description.type === "answer";
                await pc.setRemoteDescription(description);
                isSettingRemoteAnswerPending = false;
                if (description.type === "offer") {
                  await pc.setLocalDescription();
                  signaler.send({ description: pc.localDescription });
                }
              } else if (candidate) {
                try {
                  await pc.addIceCandidate(candidate);
                } catch (err) {
                  if (!ignoreOffer) {
                    throw err;
                  }
                }
              }
            } catch (err) {
              console.error(err);
            }
          };

          //transmit the offer to the node server

          console.log(stream)
        }

        initMediaConnection();

        return () => {
            if (VF.videoRef.current?.srcObject) {
                const tracks = (VF.videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, [VF.isAudioEnabled, VF.isVideoEnabled]);

    return <video ref={VF.videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
}
