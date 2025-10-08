import { useContext, useEffect, useRef } from 'react';
import { VideoFeedContext } from './contexts/VideoFeedContext';
import { v4 as uuid } from 'uuid';

// TODO: move this into a separate types directory
type SignalMessageType = "offer" | "answer" | "candidate" | "subscribe" | "unsubscribe";
interface SignalMessage {
    type: SignalMessageType;
    clientId?: string;
    roomId?: string;
    payload?: unknown;
}

interface SdpOffer {
    sdp: string;
}

interface SdpAnswer {
    sdp: string;
}

interface IceCandidate {
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
}

export default function VideoFeed() {
    const VF = useContext(VideoFeedContext);

    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const clientId = useRef<string | null>(null);

    useEffect(() => {

        const initPeerConnection = (stream: MediaStream) => {
            const pc = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com"
                    }
                ]
            });
            pcRef.current = pc;

            // Add local tracks
            pc.addTrack(stream.getTracks()[0], stream) // Also add audio track when available
            
            // Handle remote tracks
            pc.ontrack = (event: RTCTrackEvent) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            }

            // Send local ICE candidates through web socket
            pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                if (event.candidate) {
                    const candidateMessage: SignalMessage = {
                        type: "candidate",
                        clientId: clientId.current,
                        payload: event.candidate,
                    }
                    wsRef.current?.send(JSON.stringify(candidateMessage));
                }
            }

            // Create initial offer
            pc.createOffer().then((offer) => {
                pc.setLocalDescription(offer).then(() => {
                    if (!pc.localDescription) return;
                    //const payload = JSON.stringify({ sdp: pc.localDescription });
                    const offerMessage: SignalMessage = {
                        type: "offer",
                        clientId: clientId.current,
                        payload: pc.localDescription,
                    }
                    wsRef.current?.send(JSON.stringify(offerMessage));
                })
            })
        }

        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: VF.isVideoEnabled, audio: VF.isAudioEnabled});
                if (VF.videoRef.current) {
                    VF.videoRef.current.srcObject = stream;
                    VF.videoRef.current.play();
                }
                initPeerConnection(stream);

            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        }

        clientId.current = uuid();

        // Connect to the WebSocket signaling server (TODO: refactor into separate component)
        const ws = new WebSocket("ws://localhost:3000/ws")
        wsRef.current = ws;

        ws.onmessage = async (event: MessageEvent) => {
            const pc = pcRef.current;
            if (!pc) return;

            console.log("Message received: " + event.data);
            const msg: SignalMessage = JSON.parse(event.data);
            console.log("msg: ", msg)
            if (!msg.payload) return;


            switch (msg.type) {
                case "answer":
                    const answer = msg.payload as SdpAnswer;
                    pc.setRemoteDescription(new RTCSessionDescription({type: "answer", sdp: answer.sdp}));
                    break;
                case "candidate":
                    const candidate = msg.payload as IceCandidate;
                    pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log("New ice candidate: ", candidate)
                    break;
                default:
                    console.log("Unknown message type:", msg.type);
                    break;
            }
        }

        initCamera();

        return () => {
            if (VF.videoRef.current?.srcObject) {
                const tracks = (VF.videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, [VF.isAudioEnabled, VF.isVideoEnabled]);

    return <video ref={VF.videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
}