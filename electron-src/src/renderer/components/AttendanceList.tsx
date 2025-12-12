
import { Endpoints } from '@/utils/endpoints';
import { Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import React, { useEffect, useState } from 'react'

function AttendanceList({isOpen, onOpenChange, room_id}) {
    const [sessions, setSessions] = useState([]);
    const gen_att_list = async (sessionId) => {
        //filter through all attendees by sessionId
        try {
            const token = localStorage.getItem("bridge_token");
            const response = await fetch(`${Endpoints.ATTENDANCE}/getAllSession/${sessionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch user session entry");
            }
            const data = await response.json();
            if (data) {
                console.log("RESPONSE: ", data)
                return data;

            }
        } catch (error) {
            
        }

    };
    const getRoomsSessions = async (roomId) => {
        try {
            const token = localStorage.getItem("bridge_token");
            const response = await fetch(`${Endpoints.SESSIONS}/getSessionsByRoom/${roomId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch user session entry");
            }
            const data = await response.json();
            if (data) {
                console.log("RESPONSE: ", data)
                return data;
            }
        } catch (error) {
            console.log("ERROR: ", error)
        }
    };
    const getSessionsAndAttendees = async (roomId) => {
        const roomsSessions = await getRoomsSessions(roomId);
        const sessionsAttendees = await Promise.all(
            roomsSessions.map(async (session) => {
                const attendees = await gen_att_list(session.id)
                console.log("Attendees: ", attendees, " for session: ", session.id)
                return {...session, attendees}
            })
        );
        sessionsAttendees.sort((a, b) => a.session_number - b.session_number);
        setSessions(sessionsAttendees);
    }

    useEffect(() => {
      getSessionsAndAttendees(room_id);
      return () => {
        
      }
    }, [])
    


    return( 
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
                        <ModalHeader className="flex flex-col gap-1">Room Attendance</ModalHeader>
                        <ModalBody>
                            {sessions.map((session) => (
                                <div key={session.id} className="session-block">
                                <h3>Session #{session.session_number}</h3>
                                
                                <Divider/>
                                  <div className="grid grid-cols-2 font-semibold border-b pb-2 mb-2">
                                    <span>Name</span>
                                    <span className="text-right">Total Time</span>
                                </div>
                                <Divider/>

                                <ul className="attendee-list">
                                    {session.attendees.map((attendee) => (
                                    <li key={attendee.id} className="grid grid-cols-2 items-center border-b pb-1">
                                        <span className="attendee-name">{attendee.user_name}</span>
                                        <span className="attendee-time text-right text-gray-600">{"  "}{attendee.total_time}  mins
                                        </span>
                                    </li>
                                    ))}
                                </ul>
                                </div>
                        ))}

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

export default AttendanceList;
