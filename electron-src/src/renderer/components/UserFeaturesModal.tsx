import { Button, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import React, { useEffect, useState } from 'react'
import {useAudioContext} from "../contexts/AudioContext";
import AudioInputOptions from "./AudioInputOptions"
import AudioOutputOptions from "./AudioOutputOptions"
import MicSensitivity from "./MicSensitivity";
import EchoCancellationToggle from "./EchoCancellationToggle";
import NoiseSuppressionToggle from "./NoiseSuppressionToggle";
import AudioMeter from "./AudioMeter";
import { Endpoints } from "@/utils/endpoints";
import { Check, Hand, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserFeaturesModalProps{
    roomId: string;
    onOpen: () => void;
    isOpen: boolean;
    onOpenChange: () => void;
}
interface RoomMember{
  uuid: string;
  state: string;
  name: string;
}




export default function UserFeaturesModal({roomId, isOpen, onOpen, onOpenChange}: UserFeaturesModalProps) {
  const [waitingMembers, setWaitingMembers] = useState<RoomMember[]>([]);
    const [handsRaised, setHandsRaised] = useState<RoomMember[]>([]);

  const [user_status, setUserStatus] = useState("");
  const { user } = useAuth();
  const {analyserNode} = useAudioContext()

  const getUserStatus = async () => {
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
          setUserStatus("Host");
          const all_members = room_data.room_members;
          const waiting_members = all_members.filter(entry => (entry.state==='user_waiting')) || [];
          setWaitingMembers(waiting_members);
        }
        else {
          setUserStatus("Member");
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
        //filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === "UPDATE") {
          console.log("UPDATING WAITING ROOM MEMBERS ")
          const updated_RM = payload.new.room_members;
          const waiting_members = updated_RM.filter(entry => (entry.state==='user_waiting')) || [];
          setWaitingMembers(waiting_members);
          const hands_raised = updated_RM.filter(entry => (entry.state==='hand_raised')) || [];
          setHandsRaised(hands_raised);
        }
      }
    )
    .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [])


  useEffect(() => {

    getUserStatus();

    /*
    if (user_status === "Host") {
      getWaitingMembers();
    }
      */
  }, []);



  const admitMember = async (member) => {
    try {
      const token = localStorage.getItem("bridge_token");
      const response = await fetch(`${Endpoints.ROOMS}/updateStatusRoomMember/${roomId}`, {
        method: "PUT",
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uuid: member.uuid,
          new_state: "user_admitted",
          name: member.name
        }),
      }).then((response) => response.json()
    )
      .then((data) => {
        console.log("✅ ROOM MEMBER ADMITTED SUCCESFULLY:", data)
        //setWaitingMembers(data.room_members)
      })
      
    } catch (error) {
      
    }
  };
  const denyMember = async (member) => {
        try {
          const token = localStorage.getItem("bridge_token");
          console.log("TRYING TO REMOVE: ", Endpoints.ROOMS, "/removeRoomMember", roomId )
          const response = await fetch(`${Endpoints.ROOMS}/removeRoomMember/${roomId}`, {
            method: "PUT",
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              uuid: member.uuid
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


  return (
    <Modal 
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            placement="center"
            backdrop="opaque"
            classNames={ {
                body: "py-6",
                backdrop: "bg-[#ffffff]/50 backdrop-opacity-40",
                base: "border-[#ffffff] bg-[#ffffff]",
                header: "border-b-[1px] border-[#ffffff]",
                footer: "border-t-[1px] border-[#ffffff]",
            }

            }
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Waiting Room</ModalHeader>
                        <ModalBody>
                          { user_status === "Host" && (<>
                             <h3 className="font-semibold mb-4">Users Waiting</h3>
                            {/*
                                TODO: entries for participants waiting
                                - Call must be active
                            */}
                            
                              <div>
                                { waitingMembers.map((mem) =>(
                                  <>
                                    <li  
                                      key={mem.uuid}           
                                      className="text-gray-800 flex items-center justify-between group"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <span className="text-sm font-medium truncate">
                                            {mem.name}
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        className="flex items-center gap-2 ml-2"
                                      >
                                        <Button
                                          size="sm"
                                          radius="md"
                                          variant="flat"
                                          onPress={() => admitMember(mem) }
                                          className="text-xs bg-white-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1"
                                        >
                                          <Check size={14} />
                                          Admit
                                        </Button>

                                        <Button
                                          size="sm"
                                          radius="md"
                                          variant="flat"
                                          onPress={() => denyMember(mem) }
                                          className="text-xs bg-white-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1"
                                        >
                                          <X size={14} />
                                          Deny
                                        </Button>

                                      </div>
                                    </li>
                                  </>
                                ))}
                              </div>
                            
                             <h3 className="font-semibold mb-4">Hands Raised</h3>
                             <div>
                                { handsRaised.map((mem) =>(
                                  <>
                                    <li  
                                      key={mem.uuid}           
                                      className="text-gray-800 flex items-center justify-between group"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <span className="text-sm font-medium truncate">
                                            {mem.name}
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        className="flex items-center gap-2 ml-2"
                                      >
                                        <Hand size={14} />
                                      </div>
                                    </li>
                                  </>
                                ))}
                              </div>
                            </>)
                            
                            }

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
                              <div className="flex flex-row flex-[2] min-w-[300px] mt-2 mb-2">
                                <div className="p-4">
                                <AudioMeter
                                  title="File 1"
                                  analyzerNode={analyserNode}
                                  size={0.5}/>
                              </div>
                              <div className="p-4">
                                <label>Echo Cancellation</label>
                                <EchoCancellationToggle/>
                                <br/>
                                <label>Noise Reduction</label>
                                <NoiseSuppressionToggle/>
                                </div>  
                              </div>
                            </div>

                        </ModalBody>
                    </>
                    )   
                }
            </ModalContent>
        </Modal>
  )
};
