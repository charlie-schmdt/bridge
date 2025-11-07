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
                            Settings and whatnot

                        </ModalBody>
                    </>
                    )   
                }
            </ModalContent>
        </Modal>
  )
};