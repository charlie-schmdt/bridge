import { useAuth } from "@/renderer/contexts/AuthContext";
import { Endpoints } from "@/utils/endpoints";
import mic from "@assets/microphone_active.png";
import micOff from "@assets/microphone_inactive.png";
import videopng from "@assets/video.png";
import video_inactivepng from "@assets/video_inactive.png";
import { Button, useDisclosure } from "@heroui/react";
import { Hand, HandGrab } from "lucide-react";
import { useState } from "react";
import UserFeaturesModal from "../../components/UserFeaturesModal";
import { useRoomMediaContext } from "./RoomMediaContext";

export interface RoomSettingsFooterProps {
  onLeave: () => void;
  onShare: () => void;
  stopShare: () => void;
  toggleView: () => void;
  roomId: string;
  screenIsShared: boolean;
}

export function RoomSettingsFooter({ roomId, screenIsShared, onLeave, onShare, stopShare, toggleView }: RoomSettingsFooterProps) {
  const VF = useRoomMediaContext();
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [handStatus, setHandStatus] = useState("Raise Hand");
  const { user } = useAuth();

    const db_raise_hand = async () => {
      try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(`${Endpoints.ROOMS}/updateStatusRoomMember/${roomId}`, {
          method: "PUT",
          headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uuid: user.id,
            new_state: "hand_raised",
            name: user.name
          }),
        }).then((response) => response.json()
      )
        .then((data) => {
          console.log("✅ ROOM MEMBER HAND RAISED SUCCESFULLY:", data)
          //setWaitingMembers(data.room_members)
        })
        
      } catch (error) {
        
      }
    };
    const db_unraise_hand = async () => {
      try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(`${Endpoints.ROOMS}/updateStatusRoomMember/${roomId}`, {
          method: "PUT",
          headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uuid: user.id,
            new_state: "active",
            name: user.name
          }),
        }).then((response) => response.json()
      )
        .then((data) => {
          console.log("✅ ROOM MEMBER HAND RAISED SUCCESFULLY:", data)
          //setWaitingMembers(data.room_members)
        })
        
      } catch (error) {
        
      }
    };
    
  const raiseHand = async () => {
    if (handStatus === "Raise Hand") {
      setHandStatus("Hand Raised");
      db_raise_hand();
    }
    else{
      setHandStatus("Raise Hand");
      db_unraise_hand();
    }
  };


  return (
    <footer className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      {/* Left side: Logo + Nav */}
      <div className="flex flex-1 justify-start items-center gap-6">
        {/**
         * AUDIO & VIDEO CONTROLS 
         */}
         
        <div className="flex gap-4">
          <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
            onClick={VF.toggleAudio}>
              
            <img src={ VF.isAudioEnabled? mic : micOff} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />  

          </button>
          
          <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
            onClick={VF.toggleVideo}
          >
            <img src={VF.isVideoEnabled? videopng : video_inactivepng} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
          </button>
        </div>
      </div>

      {/* user settings */}
      <div className="flex flex-1 justify-center items-center gap-5">
        <Button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
          onPress={onOpen}
        >
          Menu
        </Button>
        {screenIsShared ? (
          <Button
            className="text-gray-500 hover:text-blue-600 cursor-pointer"
            onPress={stopShare}
          >
            Stop Sharing
          </Button>
        ) : (
          <Button
            className="text-gray-500 hover:text-blue-600 cursor-pointer"
            onPress={onShare}
          >
            Share Screen
          </Button>
        )}
        <Button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
          onPress={toggleView}
        >
          Change View
        </Button>
        <UserFeaturesModal roomId={roomId} isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange}/>
      </div>


      {handStatus === "Raise Hand" && 
      (  <Button
        size="sm"
        radius="md"
        variant="flat"
        onPress={() => raiseHand() }
        className="text-xs bg-white-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1"
      >
        <HandGrab size={14} />
        {handStatus}
      </Button>)
      }
      {handStatus === "Hand Raised" && 
      (  <Button
        size="sm"
        radius="md"
        variant="flat"
        onPress={() => raiseHand() }
        className="text-xs bg-white-100 text-red-700 hover:bg-blue-200 flex items-center gap-1"
      >
        <Hand size={14} />
        {handStatus}
      </Button>)
      }
    </footer>
  );
};
