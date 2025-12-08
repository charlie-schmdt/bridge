import { Button } from '@/renderer/components/ui/Button';
import { CallStatus } from '@/renderer/types/roomTypes';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import { useAudioContext } from "../../contexts/AudioContext";
import { useAuth } from '../../contexts/AuthContext';
import { RoomConnectionManager, RoomConnectionManagerCallbacks } from './RoomConnectionManager';
import { useRoomMediaContext } from './RoomMediaContext';
import { RoomSettingsFooter } from './RoomSettingsFooter';
import { VideoGrid } from './VideoGrid';
import WaitingRoom from '@/renderer/components/WaitingRoom';
import { supabase } from '@/renderer/lib/supabase';
import { Endpoints } from '@/utils/endpoints';

export interface RoomFeedProps {
  roomId: string | undefined;
}

export function RoomFeed({roomId}: RoomFeedProps) {
  const { user } = useAuth()
  const { initializeAudioGraph, tearDownAudioGraph, micAudioStream } = useAudioContext();
  const localRoomMedia = useRoomMediaContext();

  const [callStatus, setCallStatus] = useState<CallStatus>("inactive");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // map streamId/peerId (implemented as the same in the SFU) to its MediaStream
  const [remoteStreams, setRemoteStreams] = useState<Map<String, MediaStream>>(new Map());
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [userRole, setUserRole] = useState("");

  const roomConnectionManagerRef = useRef<RoomConnectionManager | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // Synchronous means of checking if room is active or has been exited
  const clientId = useRef<string>(uuid());

  const remoteStreamRef = useRef<MediaStream | null>(null);

  const effectiveRoomId = roomId || "testroom";

  const cleanUpRoomExit = async () => {
    try {//Remove user from room on unmount
      const token = localStorage.getItem("bridge_token");
      console.log("TRYING TO REMOVE: ", Endpoints.ROOMS, "/removeRoomMember", roomId )
      const response = await fetch(`${Endpoints.ROOMS}/removeRoomMember/${roomId}`, {
        method: "PUT",
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uuid: user.id
        }),
      }).then((response) => response.json())
      .then((data) => {
        console.log("✅ ROOM MEMBER REMOVED SUCCESFULLY:", data)

      })
    } catch (error) {
      console.error("Error updating members:", error);
      alert("Failed to update members");
    }
  };
  const getUserRole = async () => {
    try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(`${Endpoints.ROOMS}/getRoom/${roomId}`, {
          headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user room");
        }
        const data = await response.json();
        console.log("📣 Fetched room data: ", data);
        const room_data = data.room;
        const isHost = (room_data.created_by === user.id);
        

        if (isHost) {
          setUserRole("Host");
        }
        else {
          setUserRole("Member");
        }

      } catch (error) {
        console.error("Error fetching room: " , error);
      }
  };

  console.log("RENDERING ROOMFEED FOR ROOM " + effectiveRoomId);

  useEffect(() => {
    getUserRole();
    console.log("ROOM FEED CHANNEL  STARTED")
    const channel = supabase.channel("room-feed-members")
    .on("postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
      },
      async (payload) => {
        if (payload.eventType === "UPDATE") {
          console.log("UPDATING ROOM MEMBERS ");
          const updated_RM = payload.new.room_members;
          const user_entry = updated_RM.find(entry => (entry.uuid===user.id));
          if (user_entry) {
            const curr_state = user_entry.state;
            if (curr_state === "user_admitted") {
              joinRoom();
              console.log("ADMITTING USER");
            }
          }
        }
      }
    )
    .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
      cleanUpRoomExit();
      
    };
  }, [])
    

  // Initiate the WebSocket connection with the Node server
  // NOTE: This is NOT the WebRTC stream for video/audio, so it has the same lifetime as the component
  useEffect(() => {
    console.log("UUID: ", clientId);
    // Define callbacks used by the roomConnectionManager to update state
    const callbacks: RoomConnectionManagerCallbacks = {
      onStatusChange: (status: CallStatus) => setCallStatus(status),
      onRemoteStream: (stream: MediaStream) => {
        // New track received, update remoteStreams accordingly
        setRemoteStreams(prevRemoteStreams => {
          console.log("got stream id: " + stream.id);
          if (prevRemoteStreams.has(stream.id)) {
            // Stream already exists, browser instance should automatically add it to the stream
            return prevRemoteStreams;
          }
          else {
            // Add new stream to remoteStreams
            const newRemoteStreams = new Map(prevRemoteStreams);
            newRemoteStreams.set(stream.id, stream);
            return newRemoteStreams;
          }
        });
      },
      onRemoteStreamStopped: () => {
        // leave for now
      },
      onPeerExit: (peerId, peerName) => {
        // Close remote stream if the ref still holds tracks
        setRemoteStreams(prevRemoteStreams => {
          if (prevRemoteStreams.has(peerId)) {
            prevRemoteStreams.get(peerId).getTracks().forEach(track => track.stop());
            prevRemoteStreams.delete(peerId)
            const newRemoteStreams = new Map(prevRemoteStreams);
            toast(`${peerName} has left the room`);
            console.log(newRemoteStreams);
            return newRemoteStreams;
          }
          else {
            // Stream does not exist for the peerID
            console.error(`Stream does not exist for peer ${peerName} with id ${peerId}`);
            return prevRemoteStreams;
          }
        });
      },
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
      exitRoom().then(() => {
        console.log("Cleaning up connection manager...");
        manager.cleanup(); // This will disconnect and close the WebSocket
        roomConnectionManagerRef.current = null;

        // Stop audio graph
        tearDownAudioGraph();
      });
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

  //// Handle remote video component changes
  //useEffect(() => {
  //  if (!remoteVideoRef.current) {
  //    // Ref points to nothing yet, do nothing
  //    return;
  //  }

  //  if (remoteStream) {
  //    if (remoteVideoRef.current.srcObject !== remoteStream) {
  //      remoteVideoRef.current.srcObject = remoteStream;
  //      remoteVideoRef.current.play()
  //        .then(_ => {
  //          console.log("Playing remote stream")
  //        })
  //        .catch(error => {
  //          if (error.name === 'NotAllowedError') {
  //            console.error("Autoplay was prevented. User must interact with the page")
  //          }
  //          else if (error.name !== 'AbortError') { // AbortError occurs on unmount
  //            console.error("Video play() failed:", error);
  //          }
  //        });
  //    }
  //  }
  //  else {
  //    // remoteStream is null, remove video reference
  //    console.log("Remote stream is null, clearing srcObject");
  //    remoteVideoRef.current.srcObject = null;
  //  }
  //}, [remoteVideoRef, remoteStream]) // videoRef inclusion does nothing, satisfies ESLint

  // Handle local video component changes
  useEffect(() => {
    if (!localRoomMedia.videoRef.current) {
      // Ref points to nothing yet, do nothing
      return;
    }

    if (localStream) {
      if (localRoomMedia.videoRef.current.srcObject !== localStream) {
        localRoomMedia.videoRef.current.srcObject = localStream;
        localRoomMedia.videoRef.current.play()
          .then(_ => {
            console.log("Playing local stream");
          })
          .catch(error => {
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
    setCallStatus("loading");
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
  const hostStartCall = async () => {
    joinRoom();
    /*
      TODO: Host starting call tasks
    */
  };

  const exitRoom = async () => {
    roomConnectionManagerRef.current?.disconnect();

    // Stop and clear remote media
    setRemoteStreams(prevRemoteStreams => {
      Array.from(prevRemoteStreams.values()).forEach(stream => stream.getTracks().forEach(track => track.stop()));
      return new Map();
    });

    // Stop and clear local media
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    tearDownAudioGraph()

    setCallStatus("inactive");
  };

  const allStreams = useMemo(() => {
    const streams = [];
    if (localStream) {
      // The local video is always muted for the user to avoid feedback
      streams.push({ stream: localStream, isMuted: true });
    }
    Array.from(remoteStreams.values()).forEach(stream => {
      // Remote streams are not muted
      streams.push({ stream, isMuted: false });
    });
    return streams;
  }, [localStream, remoteStreams]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
      { callStatus === "inactive" ? (
        <>
          {/*
            TODO:
              Host option to start room instead of default waiting room
          */}
          
          {!isAdmitted && (<WaitingRoom 
            room_id={roomId}
            callStatus={callStatus}
          />)}
          {userRole==="Host" && <Button color="primary" onPress={hostStartCall}>Start Call</Button>}
          <Button color="primary" onPress={joinRoom}>(BYPASS ADMITTED) Join Call</Button>
        </>

      )
        :
      (
        <>
          <div className="flex-1 w-full min-h-0">
            <VideoGrid streams={allStreams} />
          </div>
          <RoomSettingsFooter roomId={roomId} onLeave={exitRoom} />
        </>
      )}
    </div>
  );
}
