import { Button, useDisclosure } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import WaitingRoom from "./WaitingRoom";

const statusColors = {
  active: "text-green-600",
  scheduled: "text-yellow-600",
  offline: "text-red-600",
};

export interface RoomCardProps {
  id: string;
  title: string;
  description: string;
  categories?: string[];
  status: "active" | "scheduled" | "offline";
  nextMeeting: string;
  editMode?: boolean;
}

export function RoomCard({ id, title, description, categories, status, nextMeeting, editMode }: RoomCardProps) {
  const navigate = useNavigate();
  const handleDeleteRoom = () => {
    // Implement room deletion logic here
    console.log(`Deleting room: ${title}`);
  };
      const {isOpen, onOpen, onOpenChange} = useDisclosure();


  return (
    <div className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow p-4 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
        
        <span className={`text-sm font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {editMode && (
          <button className="text-sm font-bold text-red-500 hover:underline cursor:pointer" onClick={() => handleDeleteRoom()}>
            Delete
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500">{description}</p>

      {categories && categories.length > 0 && (
        <div className="mt-2">
          {categories.map((category, index) => (
            <span key={index} className="inline-block bg-gray-200 text-gray-700 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
              {category}
            </span>
          ))}
        </div>
      )}

      {status === "active" && (
        <>
        <Button 
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
        //onClick={() => navigate(`/TestRoom/${id}`)}
        onPress={onOpen}
        >
          Join Room
        </Button>

        <WaitingRoom roomID={id} isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange}/>
        </>
      )}
      {status === "scheduled" && (
        <button className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg">
          View Schedule
        </button>
      )}
      {status === "offline" && (
        <button className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg">
          Start Meeting
        </button>
      )}

      <p className="text-xs text-gray-400 mt-2">Next Meeting: {nextMeeting}</p>
    </div>
  );
}
