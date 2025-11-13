import { CallStatus } from '@/renderer/types/roomTypes';
import { Button } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import { useAudioContext } from "../../contexts/AudioContext";
import { useAuth } from '../../contexts/AuthContext';
import { RoomConnectionManager, RoomConnectionManagerCallbacks } from './RoomConnectionManager';
import { useRoomMediaContext } from './RoomMediaContext';

export interface RoomFeedProps {
  streamChatClient: any;
  streamChatChannel: any;
  roomId: string;
}

export function RoomFeed({streamChatClient, streamChatChannel, roomId}: RoomFeedProps) {
  const { user } = useAuth()
  const { initializeAudioGraph, tearDownAudioGraph, micAudioStream } = useAudioContext();
  const localRoomMedia = useRoomMediaContext();

  const [callStatus, setCallStatus] = useState<CallStatus>("inactive");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  //const remoteVideoRef = useRef<HTMLVideoElement>(null);
  //const localStreamRef = useRef<MediaStream | null>(null);
  
  const roomConnectionManagerRef = useRef<RoomConnectionManager | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // Synchronous means of checking if room is active or has been exited
  const clientId = useRef<string>(uuid());

  const effectiveRoomId = roomId === undefined ? "testroom" : roomId;

  console.log("RENDERING ROOMFEED FOR ROOM " + effectiveRoomId);

  // Initiate the WebSocket connection with the Node server
  // NOTE: This is NOT the WebRTC stream for video/audio, so it has the same lifetime as the component
  useEffect(() => {
    // Define callbacks used by the roomConnectionManager to update state
    const callbacks: RoomConnectionManagerCallbacks = {
      onStatusChange: (status: CallStatus) => setCallStatus(status),
      onRemoteTrack: (track: MediaStreamTrack) => {
        if (!remoteStream) {
          // Create new remoteStream to handle the remote tracks
          console.log("Creating new stream locally and adding remote track");
          const stream = new MediaStream();
          stream.addTrack(track);
          setRemoteStream(stream);
        }
      },
      onRemoteStreamStopped: () => {
        // leave for now
      },
      onPeerExit: (peerName) => toast(`${peerName} has left the room`),
      onError: (message) => toast.error(message),
      };

    // Instantiate the connection manager
    const manager = new RoomConnectionManager(
      effectiveRoomId,
      clientId.current,
      user.name,
      callbacks
    );
    manager.initSignalingConnection(); // Start the WebSocket connection
    roomConnectionManagerRef.current = manager;

    // Start audio graph -- TJ, does this need to go before the websocket connection?
    initializeAudioGraph();

    // Return cleanup function to run on unmount
    return () => {
      console.log("Cleaning up connection manager...");
      manager.cleanup(); // This will disconnect and close the WebSocket
      roomConnectionManagerRef.current = null;

      // Stop local stream
      localStream?.getTracks().forEach(t => t.stop());

      // Stop audio graph
      tearDownAudioGraph();
    }
  }, []); // Run only once on mount

  // Toggle camera
  useEffect(() => {
    const videoTrack = localStream?.getVideoTracks()[0];
    if (videoTrack) {
      console.log("Changing videoTrack to: " + localRoomMedia.isVideoEnabled);
      videoTrack.enabled = localRoomMedia.isVideoEnabled;
    }
  }, [localStream, localRoomMedia.isVideoEnabled]);

  // Toggle microphone
  useEffect(() => {
    const audioTrack = micAudioStream?.getAudioTracks()[0];
    if (audioTrack) {
      console.log("Changing audioTrack to: " + localRoomMedia.isAudioEnabled);
      audioTrack.enabled = localRoomMedia.isAudioEnabled;
    }
  }, [micAudioStream, localRoomMedia.isAudioEnabled])

  // Handle remote video component changes
  useEffect(() => {
    if (!remoteVideoRef.current) {
      // Ref points to nothing yet, do nothing
      return;
    }

    if (remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(error => {
          if (error.name === 'NotAllowedError') {
            console.error("Autoplay was prevented. User must interact with the page")
          }
          else if (error.name !== 'AbortError') { // AbortError occurs on unmount
            console.error("Video play() failed:", error);
          }
        });
      }
    }
    else {
      // remoteStream is null, remove video reference
      console.log("Remote stream is null, clearing srcObject");
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteVideoRef, remoteStream]) // videoRef inclusion does nothing, satisfies ESLint

  // Handle local video component changes
  useEffect(() => {
    if (!localRoomMedia.videoRef.current) {
      // Ref points to nothing yet, do nothing
      return;
    }

    if (localStream) {
      if (localRoomMedia.videoRef.current.srcObject !== remoteStream) {
        localRoomMedia.videoRef.current.srcObject = remoteStream;
        localRoomMedia.videoRef.current.play().catch(error => {
          if (error.name === 'NotAllowedError') {
            console.error("Autoplay was prevented. User must interact with the page")
          }
          else if (error.name !== 'AbortError') { // AbortError occurs on unmount
            console.error("Video play() failed:", error);
          }
        });
      }
    }
    else {
      // localStream is null, remove video reference
      console.log("Local stream is null, clearing srcObject");
      localRoomMedia.videoRef.current.srcObject = null;
    }
  }, [localRoomMedia.videoRef, localStream]) // videoRef inclusion does nothing, satisfies ESLint

  const initMedia = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getVideoTracks().forEach(t => (t.enabled = localRoomMedia.isVideoEnabled));
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Error accessing camera: ", err);
      toast.error("Could not access camera and/or microphone");
      return null;
    }
  };

  const joinRoom = async () => {
    const manager = roomConnectionManagerRef.current;
    if (!manager || !micAudioStream) {
      toast.error("Connection not ready or microphone not available");
      return;
    }

    const stream = localStream || (await initMedia());
    if (!stream) {
      console.error("Error starting local media");
      toast.error("Could not start local media");
      return;
    }

    // Initiate P2P connection with the SFU
    await manager.connect(stream, micAudioStream);
  };

  const exitRoom = async () => {
    roomConnectionManagerRef.current?.disconnect();

    // Stop and clear local media
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    //Reset message channel
    if (streamChatChannel && streamChatClient) {
      streamChatChannel.truncate();
      //streamChatClient.disconnectUser();
    }
  };

  return (
    <div className="w-full h-full">
      { callStatus === "inactive" ? (
        <Button 
        className="text-white bg-blue-600 font-medium hover:text-black cursor-pointer px-2"
          
        onPress={joinRoom}>Join Call</Button>
      )
        :
      (
        <div>
          <div className="flex gap-4 p-4 w-full h-full">
            <video className="h-full w-1/2 rounded-lg" ref={localRoomMedia.videoRef} autoPlay muted />
            <video className="h-full w-1/2 rounded-lg" ref={remoteVideoRef} autoPlay />
          </div>
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
