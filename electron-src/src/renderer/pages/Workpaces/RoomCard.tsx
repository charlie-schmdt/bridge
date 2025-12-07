import { useDisclosure } from "@heroui/react";
import { Button } from "@/renderer/components/ui/Button";
import { useNavigate } from "react-router-dom";
import WaitingRoom from "../../components/WaitingRoom";
import { SquarePen, Trash2 } from "lucide-react";
import React, { useState } from "react";
import EditRoomModal from "./EditRoomModal";
import { useNotification } from "@/hooks/useNotification";
import NotificationBanner  from "../../components/NotificationBanner";
import { Endpoints } from "@/utils/endpoints";
import { useEffect } from "react";
import { parseMeetings, getNextMeeting, formatNextMeeting, Meeting } from "../../../utils/meetingUtils";
import { useAuth } from "@/renderer/contexts/AuthContext";


//import { handleDeleteRoom, handleEditRoom } from "@/renderer/utils/roomActions";

const statusColors = {
  active: "text-green-600",
  scheduled: "text-yellow-600",
  offline: "text-red-600",
};


export interface RoomCardProps {
  room_id: string;
  id: string;
  title: string;
  description: string;
  categories?: string[];
  status: "active" | "scheduled" | "offline";
  meetings:  string | Meeting[];
  editMode?: boolean;
  isOwner?: boolean;
}

export function RoomCard({
  room_id,
  id,
  title,
  description,
  categories,
  status,
  meetings,
  editMode,
  isOwner
}: RoomCardProps) {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { notification, showNotification } = useNotification(); // inside the exported component function
  const [nextMeeting, setNextMeeting] = useState("TBD");
  const {user}= useAuth();

  
    const waiting_user = {
    //for jsonb of state of user to be added to room members 

    uuid: user.id,
    state: 'user_waiting',
    name: user.name
  }
    

  useEffect(() => {
    const parsedMeetings = parseMeetings(meetings); // room.meetings is JSON
    const next = formatNextMeeting(getNextMeeting(parsedMeetings));
    setNextMeeting(next);
  }, [meetings]); // re-run if meetings prop changes



  const addToWaitingRoom = async () => {
    var user_to_add = waiting_user;
    if(isOwner) {
      const host_user = {
        uuid: user.id,
        state: 'host_joined',
        name: user.name
      };
      user_to_add = host_user;

    }
    try {
        const token = localStorage.getItem("bridge_token");
        console.log("response: ", Endpoints.ROOMS, "/addRoomMember", room_id )
        const response = await fetch(`${Endpoints.ROOMS}/addRoomMember/${room_id}`, {
          method: "PUT",
          headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_to_add
          }),
        }).then((response) => response.json())
        .then((data) => {
          /*
          setRoomMembers((prev) => prev ? { ...prev, name: updatedInfo.name, description: updatedInfo.description, members: updatedInfo.members, isPrivate: updatedInfo.isPrivate } : null);
          console.log("✅ Workspace updated successfully:", data.workspace);
          showNotification("Workspace updated successfully!", "success");
          */
          console.log("✅ Room members updated successfully:", data)
        })

        //console.log("error in response for updating room membeers")
        //console.error(data.message);
        //alert(data.message);


    } catch (error) {
      console.error("Error updating members:", error);
      alert("Failed to update members");
    }
    navigate(`/TestRoom/${room_id}`)
  };

  const handleEditRoom = (room: RoomCardProps) => {
    // open edit modal
    setIsEditModalOpen(true);
    //setRoomToEdit(room);
  }
  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("bridge_token");

      const res = await fetch(`${Endpoints.ROOMS}/delete/${roomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to delete room");

      showNotification("Room deleted successfully", "success");

      // Optional: Call a callback to update the parent list

    } catch (err: any) {
      console.error("Delete room error:", err);
      showNotification(err.message || "Failed to delete room", "error");
    }
  };


  return (
    <div className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow p-4 flex flex-col justify-between">
      {notification && (
        <div className="fixed top-20 right-4 z-[9999]">
        <NotificationBanner
            message={notification.message}
            type={notification.type as "success" | "error" | "warning" | "info" | "created"}
        />
        </div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>

        <span className={`text-sm font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>

        {editMode && (
          <div className="flex items-center gap-2">
            {/* EDIT BUTTON */}
            <Button
              size="sm"
              radius="md"
              variant="flat"
              onPress={() => handleEditRoom({ room_id, id, title, description, categories, status, meetings })}
              className="text-xs bg-white-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1"
            >
              <SquarePen size={16} />
            </Button>

            {/* DELETE BUTTON */}
            <Button
              size="sm"
              radius="md"
              variant="flat"
              onPress={() => { handleDeleteRoom(id) }}
              className="text-xs bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">{description}</p>

      {categories?.length > 0 && (
        <div className="mt-2">
          {categories.map((category, index) => (
            <span
              key={index}
              className="inline-block bg-gray-200 text-gray-700 text-xs font-medium mr-2 px-2.5 py-0.5 rounded"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* ACTION BUTTONS */}
      {status === "active" && (
        <>
          <Button
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
            onPress={addToWaitingRoom}
          >
            Join Room
          </Button>
        </>
      )}

      {status === "scheduled" && (
        <Button className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg">
          View Schedule
        </Button>
      )}

      {status === "offline" && (
        <Button className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg">
          Start Meeting
        </Button>
      )}

      <p className="text-xs text-gray-400 mt-2">Next Meeting: {nextMeeting}</p>

      {/* EDIT ROOM MODAL */}
      {/*
      <EditRoomModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        room={{ id, title, description, categories, status, meetings: meetings }}
        onSuccess={() => showNotification("Room updated successfully", "success")}
      />
      */}
      
    </div>
  );
}
