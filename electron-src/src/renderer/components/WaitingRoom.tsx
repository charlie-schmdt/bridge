import { Endpoints } from "@/utils/endpoints";
import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAudioContext } from "../contexts/AudioContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import AudioInputOptions from "./AudioInputOptions";
import AudioOutputOptions from "./AudioOutputOptions";
import MicSensitivity from "./MicSensitivity";
import VF from "./VF";
/*

- session id redirection
- waiting for host rewording

*/

interface WaitingRoomProps{
    room_id: string;
    callStatus: string;
    updateAttId: (data: string) => void;
    /*
    isOpen: boolean;
    onOpen: ()=> void;
    onOpenChange: () => void;
    */
}

export default function WaitingRoom({room_id, callStatus, updateAttId}:  WaitingRoomProps){ //, isOpen, onOpen, onOpenChange}: WaitingRoomProps){ 
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

              attendeeJoinSession(payload.new.current_session);
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
      const [attendeeId, setAttendeeId] = useState(null);
  const getSessionAttendees = async (sessionId) => {
      try {
          const token = localStorage.getItem("bridge_token");
          const response = await fetch(`${Endpoints.SESSIONS}/${sessionId}`, {
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
              return data.attendees;

          }
      } catch (error) {
          
      }
  };
    const findAttBySessionUserId = async (sessionId) => {
      //filter through all attendees by sessionId
      try {
          console.log("SEARCHING: ", sessionId)
          const token = localStorage.getItem("bridge_token");
          const response = await fetch(`${Endpoints.ATTENDANCE}/findByUS/${sessionId}/${user.id}`, {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              }
          });
          if (!response.ok) {
              throw new Error("Failed to fetch user session entry");
          }
          const data = await response.json();
          if (data) {
              console.log("RESPONSE -> Found attendee by userid and sessionid: ", data)
              return data.id;

          }
          console.log("SEARCHING OVER", sessionId)

      } catch (error) {
          console.log("ERROR: ",error)

      }

  };
    const userRejoinedSession = async (attId) => {
  /*
      - last exited is going to be default now when exited
      - calculate time
  */
      const lastEntered = new Date().toISOString();
      try {
          const token = localStorage.getItem("bridge_token");
          const response = await fetch(`${Endpoints.ATTENDANCE}/updateAttendance/${attId}`, {
              method: "PUT",
              headers: {
              'Authorization': `Bearer ${token}`,
              "Content-Type": "application/json",
              },
              body:  JSON.stringify({
                  update_type: "rejoined",
                  last_entered: lastEntered
              })
          });
          const data = await response.json();
          if (data.success) {
              console.log("✅ Updated attendance entry successfully:", data);
          } else {

          }
      } catch (error) {
          console.log("ERROR: ",error)
      }

  };
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
        const userFirstTimeJoinSession = async (sessionId) => {
  const lastEntered = new Date().toISOString();
  try {
      const token = localStorage.getItem("bridge_token");
      const response = await fetch(`${Endpoints.ATTENDANCE}/createAttendance/${sessionId}`, {
          method: "POST",
          headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          },
          body:  JSON.stringify({
              user_id: user.id,
              user_name: user.name,
              last_entered: lastEntered
          })
      });
      const data = await response.json();
      if (data.success) {
          const set = data.attendance.id;
          console.log("✅ Attendance admitted to session successfully:", data.attendance);
          return [set, lastEntered];
      } else {

      }
  } catch (error) {
      console.log("ERROR: ",error)
  }

  };
    const addAttendeeToSessionList = async (userId, sessionId) => {
  try {
      const token = localStorage.getItem("bridge_token");
      const response = await fetch(`${Endpoints.SESSIONS}/addAttendee/${sessionId}`, {
          method: "PUT",
          headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json",
          },
          body:  JSON.stringify({
              attendee: userId
          })
      });
      const data = await response.json();
      if (data.success) {
          console.log("✅ Updated to session successfully:", data.attendees);
      } else {

      }
  } catch (error) {
      console.log("ERROR: ",error)
  }

  };
  

        const attendeeJoinSession = async (sessionId) => {
      const attendees = await getSessionAttendees(sessionId); //get attendees from attendance table from same sessionID
      let id = null;
      if (attendees.includes(user.id)) { //if attendee in session, then they are rejoining
          id = await findAttBySessionUserId(sessionId);
          if(id) {
              setAttendeeId(id);
              updateAttId(id);
              userRejoinedSession(id);
          }
      }
      else {
          const [newId, len] = await userFirstTimeJoinSession(sessionId);
          setAttendeeId(newId);
          updateAttId(newId)
          await addAttendeeToSessionList(user.id, sessionId);
      }

  };
    
    const videoRef = useRef<HTMLVideoElement>();//useRef<HTMLVideoElement>(null)

    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Waiting Room</h1>
        <div className="grid grid-cols-3 gap-6">
          
          <div className="col-span-3">
          {/* Video Section */}
          <Card>
            <CardHeader>Video Settings</CardHeader>
            <Divider />
            <CardBody>
                <VF />
            </CardBody>
          </Card>
          </div >  
          {/* Audio Settings  */}
          <div className="col-span-2">
          <Card>
            <CardHeader>Audio Settings</CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
              <div>
                <label className="mb-1">Input Source</label>
                <AudioInputOptions />
              </div>
              <div>
                <label className="mb-1">Destination</label>
                <AudioOutputOptions />
              </div>
            </CardBody>
          </Card>
          </div>
          {/* Mic Sensitivity */}
          <div>
          <Card>
            <CardHeader>Mic Sensitivity</CardHeader>
            <Divider />
            <CardBody>
              <MicSensitivity />
            </CardBody>
          </Card>
          </div>
                <div className="flex flex-col flex-[2] min-w-[300px] mt-2 mb-2">
                  <div className="p-4">
                    {/*<AudioMeter/>*/}
                    </div>     
                </div>
        </div>
      </div>
    );
}

