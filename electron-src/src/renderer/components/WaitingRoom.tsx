import { Card, CardBody, Modal, ModalHeader, ModalContent, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Button} from "@heroui/react";
import { useState, useRef, createRef } from "react";
import { useEffect } from "react";
import mic from "@assets/microphone_active.png";
import micOff from "@assets/microphone_inactive.png";
import videopng from "@assets/video.png"
import video_inactivepng from "@assets/video_inactive.png"
import { useCamera } from "@/hooks/useCamera";
/*

- session id redirection
- waiting for host rewording

*/

interface WaitingRoomProps{
    onOpen: () => void;
    isOpen: boolean;
    onOpenChange: () => void;
}

export default function WaitingRoom({isOpen, onOpen, onOpenChange}: WaitingRoomProps){ 
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
                             <video
                                        ref={videoRef}
                                        autoPlay={true}
                                        muted={true}
                                        className={`w-[25%] h-[25%] ${isCameraEnabled ? 'block' : 'hidden'}`}
                                        />
                                {/* blue rectangle with name of user or video if enabled*/
                                    

                                       
                                       /* <video ref={videoRef} style={{ width: '25%', height: '25%' }} />*/
                                        
                                    
                                    !isCameraEnabled && (
                                        <div className="h-[25%] w-[25%] bg-blue-500"></div>
                                        //
                                            //TODO: buttons for video and audio
                                        //
                                    )


                                }

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

