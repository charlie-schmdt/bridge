import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import React from 'react'
import {useAudioContext} from "../contexts/AudioContext";
import AudioInputOptions from "./AudioInputOptions"
import AudioOutputOptions from "./AudioOutputOptions"
import MicSensitivity from "./MicSensitivity";
import EchoCancellationToggle from "./EchoCancellationToggle";
import NoiseSuppressionToggle from "./NoiseSuppressionToggle";
import AudioMeter from "./AudioMeter";

interface UserFeaturesModalProps{
    onOpen: () => void;
    isOpen: boolean;
    onOpenChange: () => void;
}

export default function UserFeaturesModal({isOpen, onOpen, onOpenChange}: UserFeaturesModalProps) {
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
                             <h3 className="font-semibold mb-4">Users Waiting</h3>
                            {/*
                                TODO: entries for participants waiting
                                button for accept or reject, entry disappear or enter accordingly
                            */}
                            <ul className="space-y-2">
                                
                                User1
                            </ul>

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
                                <AudioMeter/>
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
