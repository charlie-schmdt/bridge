import { Card, CardBody, Modal, ModalHeader, ModalContent, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Button, CardHeader, CardFooter} from "@heroui/react";
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
}

export default function WaitingRoom({room_id , callStatus}: WaitingRoomProps){ 
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
      <Card>
        <CardHeader className="flex flex-col gap-1">Waiting Room</CardHeader>
        <CardBody>
            <div>
                <VF />
            </div>   
            {/* Meeting details*/}
            {/*turn on/off camera and audio*/}
            <div className="grid grid-cols-1 grid-rows-2 flex-1 min-w-[300px] mt-2 mb-2">
                <div className="p-1 ">
                  <label className="mb-1">Video source:</label>
                </div>
                <div className="p-1 ">
                    <Select
                        aria-label="Video Sources"
                        /*
                        selectedKeys={[]}
                        onSelectionChange={(keys) =>
                            setVideoSource("default")
                        }
                        */
                    variant="bordered"
                    className="max-w-md"
                        classNames={{
                        trigger: "bg-neutral-50 border border-neutral-200 focus:border-primary rounded-lg shadow-sm transition-colors flex justify-between items-center cursor-pointer",
                        value: "text-neutral-900",
                        popoverContent: "shadow-lg border border-neutral-200 rounded-lg bg-white",
                        }}
                    >
                        <SelectItem className="hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" key="default">User Default Video Source</SelectItem>

                    
                    </Select>                                
                </div>
              </div>
            <>
            <div className="flex flex-col  rounded-xl shadow gap-4">
              <div className="grid grid-cols-1 grid-rows-2 flex-1 min-w-[300px] mt-2 mb-2">
                <div className="p-1 ">
                  <label className="mb-1">Input source:</label>
                </div>
                <div className="p-1 ">
                  <AudioInputOptions />
                </div>
              </div>
              <div className="grid grid-cols-1 grid-rows-2 flex-1 min-w-[300px] mt-2 mb-2">
                <div className="p-1 ">
                  <label className="mb-1">Destination:</label>
                </div>
                <div className="p-1 ">
                  <AudioOutputOptions />
                </div>  
              </div>
            </div>

            <div className="flex flex-col flex-[2] min-w-[300px] mt-2 mb-2">
              <div className="p-4 ">
                <label className="mb-2">Mic Sensitivity:</label>
              </div>
              <div className="p-4 ">
                <MicSensitivity/>
              </div>
              <div className="p-4">
                {/*<AudioMeter/>*/}
                </div>     
            </div>
            </>
        </CardBody>
        <CardFooter>

        </CardFooter>
              
          
      </Card>

    );
}

