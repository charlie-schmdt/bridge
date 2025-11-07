import { Button, Card, CardBody, useDisclosure } from '@heroui/react'
import React, { useState } from 'react'
import Header from './Header'
import WaitingRoom from './WaitingRoom';
import RoomLayout from '../RoomLayout';

/*
TODO: empty with header and button to enter waiting room, opens modal, or renders the call

  status: "active" | "scheduled" | "offline";

*/

export function TestWaitingRoomCall() {
    const [isRenderCall, setIsRenderCall] = useState(false);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [status, setstatus] = useState('offline');


  return (
    <Card>
         <Header />

        <CardBody>
          
        {
        status === "offline" && (
            <>
                <Button 
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                    /*onClick={() => navigate("/WaitingRoom")}*/
                    onPress={onOpen}
                    >
                      Join Room
                </Button>
                <WaitingRoom isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange}/>
                {/*
                    TODO:
                    Set call active from waiting room based on criteria
                    
                */}
            </>
        )
        }

        {
            status === "active" && (
                <>
                    <RoomLayout />
                </>

            )

        }


             
        </CardBody>
    </Card>
  )
}

export default TestWaitingRoomCall
