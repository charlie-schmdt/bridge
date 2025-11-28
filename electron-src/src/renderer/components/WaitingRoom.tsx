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
/*

- session id redirection
- waiting for host rewording

*/

interface WaitingRoomProps{
    roomID: string;
    callStatus: string;
}

export default function WaitingRoom({roomID, callStatus}: WaitingRoomProps){ 
    const navigate = useNavigate();
    const { user } = useAuth();
    
    
    const [videoSource, setVideoSource] = useState(
        /*
            TODO: add video source options, default, and populate with user's video sources
        */
       "default"
    )
    const { initializeAudioGraph, tearDownAudioGraph } = useAudioContext();

    useEffect(() => {
      initializeAudioGraph()

      return () => {
        //tearDownAudioGraph();
      }
    },[]
  )
    
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

