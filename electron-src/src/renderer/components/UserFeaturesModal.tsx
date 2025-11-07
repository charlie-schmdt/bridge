import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import React from 'react'

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

                        </ModalBody>
                    </>
                    )   
                }
            </ModalContent>
        </Modal>
  )
};