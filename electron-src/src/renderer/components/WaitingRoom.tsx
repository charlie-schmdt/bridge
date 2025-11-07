import { Card, CardBody, Modal, ModalHeader, ModalContent, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Button} from "@heroui/react";
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
import { useNavigate } from "react-router";
/*

- session id redirection
- waiting for host rewording

*/

interface WaitingRoomProps{
    roomID: string;
    onOpen: () => void;
    isOpen: boolean;
    onOpenChange: () => void;
}

export default function WaitingRoom({roomID, isOpen, onOpen, onOpenChange}: WaitingRoomProps){ 
    const navigate = useNavigate();
    const [videoSource, setVideoSource] = useState(
        /*
            TODO: add video source options, default, and populate with user's video sources
        */
       "default"
    )
    
    
    const videoRef = useRef<HTMLVideoElement>();//useRef<HTMLVideoElement>(null)
    const { video, isCameraInitialised, isCameraEnabled, error, toggleCamera } = useCamera(videoRef);

    /*
    useEffect(() => {
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoEnabled, audio: isAudioEnabled});
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        }
        initCamera();

        return () => {

        }
    }, []);
    */
   


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
                            <button
                                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                                onClick={() => navigate(`/TestRoom/${roomID}`)}
                            >
                                Admin Test Skip WR
                            </button>
                            <div>
                                {/*
                                <video
                                    ref={videoRef}
                                            autoPlay={true}
                                            muted={true}
                                    className={`w-[25%] h-[25%] ${isCameraEnabled ? 'block' : 'hidden'}`}
                                />
  
                                    !isCameraEnabled && (
                                        <div className="h-[25%] w-[25%] bg-blue-500"></div>
                                    )
                                */}
                            </div>

                             <div className="flex gap-4">
                                        {/*
                                        <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
                                            onClick={setIsAudioEnabled(!isAudioEnabled)}>
                                            
                                            <img src={ isAudioEnabled? mic : micOff} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />  

                                        </button>
                                        */}
                                        
                                        <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
                                            onClick={
                                                toggleCamera
                                                
                                            }
                                        >
                                            <img src={isCameraEnabled? videopng : video_inactivepng} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
                                        </button>
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
                            </div>
                        </ModalBody>
                        <ModalFooter>

                        </ModalFooter>
                    </>
                )

                }
                
            </ModalContent>

        </Modal>

    );
}

