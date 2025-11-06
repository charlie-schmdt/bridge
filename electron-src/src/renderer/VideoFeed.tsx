import { useState, useContext, useEffect, useRef } from 'react';
import { useVideoFeedContext, VideoFeedContext } from './contexts/VideoFeedContext';
import { v4 as uuid } from 'uuid';
import { Spinner, Button } from '@heroui/react';
import { lchown } from 'fs';
import { ref } from 'process';
import { WebSocketURL } from '@/utils/endpoints';

// TODO: move this into a separate types directory
type SignalMessageType = "join" | "exit" | "peerExit" | "offer" | "answer" | "candidate" | "subscribe" | "unsubscribe";
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

type callStatus = "active" | "inactive" | "loading";


export default function VideoFeed({streamChatClient, streamChatChannel}) {
    const VF = useVideoFeedContext();

    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const localStreamRef = useRef<MediaStream | null>(null);

    // Synchronous means of checking if room is active or has been exited
    const exitedRef = useRef<boolean>(true);

    const [callStatus, setCallStatus] = useState<callStatus>("inactive");

    const clientId = useRef<string | null>(null);

    console.log("RENDERING VIDEO");

    // Initiate the WebSocket connection with the Node server
    // NOTE: This is NOT the WebRTC stream for video/audio, so it has the same lifetime as the component
    useEffect(() => {

        clientId.current = uuid();

        // Connect to the WebSocket signaling server (TODO: refactor into separate component)
        const ws = new WebSocket(WebSocketURL)
        wsRef.current = ws;

        // Simple message handler
        // This will be replaced to handle WebRTC messages once the call is activated
        ws.onmessage = async (event: MessageEvent) => {
            const pc = pcRef.current;
            if (!pc) return;

            console.log("Message received (call inactive): " + event.data);
            const msg: SignalMessage = JSON.parse(event.data);
            console.log("msg: ", msg)
        }

        // Clean up on unmount (exitRoom is idempotent, can be called even if the room is not active)
        return () => {
            exitRoom();
            ws.close();
            wsRef.current = null;
        }
    }, []);

    // Handle camera changes
    useEffect(() => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        console.log("Changing videoTrack to: " + VF.isVideoEnabled);
        if (videoTrack) {
            videoTrack.enabled = VF.isVideoEnabled;
        }
    }, [VF.isVideoEnabled]);

    useEffect(() => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        console.log("Changing audioTrack to: " + VF.isAudioEnabled);
        if (audioTrack) {
            audioTrack.enabled = VF.isAudioEnabled;
        }
    }, [VF.isAudioEnabled])

    // Handle loading of video components
    useEffect(() => {
        if (VF.videoRef.current) {
            VF.videoRef.current.srcObject = localStreamRef.current;
        }
    }, [VF.videoRef.current, localStreamRef.current])

    const initMedia = async (): Promise<MediaStream | null> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getVideoTracks().forEach(t => (t.enabled = VF.isVideoEnabled));

            if (VF.videoRef.current) {
                VF.videoRef.current.srcObject = stream;
                VF.videoRef.current.play();
            }
            return stream;

        } catch (err) {
            console.error("Error accessing camera:", err);
            return null;
        }
    }

    const joinRoom = async () => {
        setCallStatus("loading");

        // Initiate media streams
        const stream = await initMedia();
        if (!stream) {
            return;
        }
        localStreamRef.current = stream;

        const ws = wsRef.current;
        if (ws === null) {
            console.error("Error: websocket reference is null in VideoFeed")
            return;
        }

        exitedRef.current = false;

        // Initiation PeerConnection with websocket signaling server
        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com"
                }
            ]
        });
        pcRef.current = pc;

        // Add local tracks
        pc.addTrack(stream.getVideoTracks()[0], stream)
        pc.addTrack(stream.getAudioTracks()[0], stream)
        
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

        // Set connection handler
        pc.onconnectionstatechange = (event: Event) => {
            switch (pc.connectionState) {
                case "connected":
                    setCallStatus("active");
                default:
                    console.log("PC Connection update: ", pc.connectionState);
            }
        }

        // Accept incoming track
        pc.ontrack = (event: RTCTrackEvent) => {
            console.log("Got remote track: ", event);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                remoteVideoRef.current.play().then(_ => {
                    // Automatic media track playback started successfully
                    // Send a PLI request to the other users to get a key frame
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        const msg = {
                            type: "pli",
                            clientId: clientId.current,
                        }
                        console.log("Sending PLI request to SFU")
                        wsRef.current.send(JSON.stringify(msg));
                    }
                })
                .catch(error => {
                    // Playback was prevented or interrupted
                    if (error.name === 'AbortError') {
                        console.warn('Video play() interrupted or prevented', error)
                    }
                    else {
                        console.error('Video playback failed:', error);
                    }
                });
            }
        }

        // Register a new message handler for the websocket that includes WebRTC messages
        ws.onmessage = async (event: MessageEvent) => {
            const pc = pcRef.current;
            if (!pc) return;

            console.log("Message received (call active): " + event.data);
            const msg: SignalMessage = JSON.parse(event.data);
            console.log("msg: ", msg)

            switch (msg.type) {
                case "offer":
                    const offer = msg.payload as SdpOffer;
                    pc.setRemoteDescription(new RTCSessionDescription({type: "offer", sdp: offer.sdp}));
                    const ans = await pc.createAnswer();
                    await pc.setLocalDescription(ans);
                    const answerMessage: SignalMessage = {
                        type: "answer",
                        clientId: clientId.current,
                        payload: pc.localDescription,
                    }
                    wsRef.current?.send(JSON.stringify(answerMessage));
                    break;
                case "answer":
                    const answer = msg.payload as SdpAnswer;
                    await pc.setRemoteDescription(new RTCSessionDescription({type: "answer", sdp: answer.sdp}));
                    break;
                case "candidate":
                    const candidate = msg.payload as IceCandidate;
                    pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log("New ice candidate: ", candidate)
                    break;
                case "peerExit":
                    // Close remote stream
                    if (remoteVideoRef.current?.srcObject) {
                        const tracks = (remoteVideoRef.current.srcObject as MediaStream).getTracks();
                        tracks.forEach(track => track.stop());
                        remoteVideoRef.current.srcObject = null;
                    }
                    break;
                default:
                    console.log("Unknown message type:", msg.type);
                    break;
            }
        }

        // Send join message
        const joinMessage: SignalMessage = {
            type: "join",
            clientId: clientId.current,
        }
        wsRef.current?.send(JSON.stringify(joinMessage));
    }

    const exitRoom = async () => {
        console.log("exiting room")
        if (exitedRef.current) {
            return;
        }
        exitedRef.current = true;
        // Send exit message
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const msg = {
                type: "exit",
                clientId: clientId.current,
            }
            wsRef.current.send(JSON.stringify(msg));
        }

        // Stop local tracks
        if (VF.videoRef.current?.srcObject) {
            const tracks = (VF.videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            VF.videoRef.current.srcObject = null;
        }

        // Close PeerConnection
        if (pcRef.current) {
            pcRef.current.close(); // Throws error if fails
            pcRef.current = null;
        }

        //Reset message channel
        if (streamChatChannel && streamChatClient) {
            streamChatChannel.truncate();
            //streamChatClient.disconnectUser();

        }


        setCallStatus("inactive");
    }

    return (
        <div className="w-full h-full">
            { callStatus === "inactive" ? (
                <Button 
                className="text-white bg-blue-600 font-medium hover:text-black cursor-pointer px-2"
                
                onPress={joinRoom}>Call In</Button>
            )
                :
            (
                <div>
                    { callStatus === "loading" ? (
                        <Spinner />
                    )
                    :
                    (
                        <div className="flex gap-4 p-4 w-full h-full">
                            <video className="h-full w-1/2 rounded-lg" ref={VF.videoRef} autoPlay muted />
                            <video className="h-full w-1/2 rounded-lg" ref={remoteVideoRef} autoPlay />
                        </div>
                    )}
                    <Button 
                        onPress={exitRoom}
                        className="text-white bg-red-600 font-medium hover:text-black cursor-pointer px-2"
                    >
                        Call Out
                    </Button>
                </div>
            )}
        </div>
    );
}