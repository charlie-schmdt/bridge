import { Card, CardBody, Modal, ModalHeader, ModalContent, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Button, CardHeader, CardFooter, Divider} from "@heroui/react";
import { useState, useRef, createRef } from "react";
import { useEffect } from "react";
import mic from "@assets/microphone_active.png";
import micOff from "@assets/microphone_inactive.png";
import videopng from "@assets/video.png"
import video_inactivepng from "@assets/video_inactive.png"
import { useCamera } from "@/hooks/useCamera";
import {useAudioContext} from "../contexts/AudioContext";
import AudioInputOptions from "./AudioInputOptions"
import AudioOutputOptions from "./AudioOutputOptions"
import MicSensitivity from "./MicSensitivity";
import AudioMeter from "./AudioMeter";
import { useNavigate } from "react-router";
import VF from "./VF";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "@/utils/endpoints";
import { supabase } from "../lib/supabase";
/*

- session id redirection
- waiting for host rewording

*/

interface WaitingRoomProps{
    room_id: string;
    callStatus: string;
    /*
    isOpen: boolean;
    onOpen: ()=> void;
    onOpenChange: () => void;
    */
}

export default function WaitingRoom({room_id, callStatus}:  WaitingRoomProps){ //, isOpen, onOpen, onOpenChange}: WaitingRoomProps){ 
    const navigate = useNavigate();
    const { user } = useAuth();
    const [videoSource, setVideoSource] = useState(
        /*
            TODO: add video source options, default, and populate with user's video sources
        */
       "default"
    )
    const [user_role, setUserRole] = useState("");
    const [user_status, setUserStatus] = useState("user_waiting");
    
    const { initializeAudioGraph, tearDownAudioGraph } = useAudioContext();
    const getUserRole = async () => {
        try {
            const token = localStorage.getItem("bridge_token");
            const response = await fetch(`${Endpoints.ROOMS}/getRoom/${room_id}`, {
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

    useEffect(() => {
      console.log("CHANNEL STARTED")
      const channel = supabase.channel("waiting-room")
      .on("postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated_RM = payload.new.room_members;
            const curr_state = updated_RM.find(entry => (entry.uuid === user.id));
            if (curr_state && (curr_state.state === "user_admitted")) {
              setUserStatus("user_admitted");
              callStatus = "active";
            }
          }
        }
      )
      .subscribe();
    
      return () => {
        supabase.removeChannel(channel);
      };
    }, [room_id])
    

    useEffect(() => {
      initializeAudioGraph()
      getUserRole();

      return () => {
        //tearDownAudioGraph();

       removeFromWaitingRoom()
      }
    },[]
    )
      const removeFromWaitingRoom = async () => {
        try {
          const token = localStorage.getItem("bridge_token");
          console.log("TRYING TO REMOVE: ", Endpoints.ROOMS, "/removeRoomMember", room_id )
          const response = await fetch(`${Endpoints.ROOMS}/removeRoomMember/${room_id}`, {
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
    
          //console.log("error in response for updating room membeers")
          //console.error(data.message);
          //alert(data.message);
    
    
        } catch (error) {
          console.error("Error updating members:", error);
          alert("Failed to update members");
        }
      };
    
    const videoRef = useRef<HTMLVideoElement>();//useRef<HTMLVideoElement>(null)

    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Waiting Room</h1>
        <div className="grid grid-cols-3 gap-6">
          
          <div className="col-span-3">
          {/* Video Section */}
          <Card>
            <CardHeader>Video Settings</CardHeader>
            <Divider />
            <CardBody>
                <VF />
            </CardBody>
          </Card>
          </div >  
          {/* Audio Settings  */}
          <div className="col-span-2">
          <Card>
            <CardHeader>Audio Settings</CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              <div>
                <label className="mb-1">Input Source</label>
                <AudioInputOptions />
              </div>
              <div>
                <label className="mb-1">Destination</label>
                <AudioOutputOptions />
              </div>
            </CardBody>
          </Card>
          </div>
          {/* Mic Sensitivity */}
          <div>
          <Card>
            <CardHeader>Mic Sensitivity</CardHeader>
            <Divider />
            <CardBody>
              <MicSensitivity />
            </CardBody>
          </Card>
          </div>
                <div className="flex flex-col flex-[2] min-w-[300px] mt-2 mb-2">
                  <div className="p-4">
                    {/*<AudioMeter/>*/}
                    </div>     
                </div>
        </div>
      </div>
    );
}

