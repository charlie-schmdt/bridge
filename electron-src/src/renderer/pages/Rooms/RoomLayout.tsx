import { Button } from '@/renderer/components/ui/Button';
import { Endpoints } from '@/utils/endpoints';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "../../components/Chat";
import { useAudioContext } from "../../contexts/AudioContext";
import { RoomFeed } from "./RoomFeed";
import { RoomMediaProvider } from "./RoomMediaProvider";

interface RoomLayoutProps{}

interface Room {
  room_id: string;
  name: string;
  created_by: string;
  // ... other fields
}

export const RoomLayout = ({}: RoomLayoutProps) => {
  const [isChatOpen, setIsChatOpen ] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const { tearDownAudioGraph } = useAudioContext();
  const toggleChat = () => setIsChatOpen(prevIsChatOpen => !prevIsChatOpen);

  const navigate = useNavigate();

  const { roomId } = useParams<{ roomId: string }>();

  // Fetch room details to get created_by (owner)
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      
      try {
        console.log('🔍 Fetching room details for:', roomId);
        const response = await fetch(`${Endpoints.ROOMS}/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
          }
        });
        
        console.log('📡 Room fetch response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Room data received:', data);
          setRoom(data.room);
        } else {
          console.error('❌ Failed to fetch room:', response.status, await response.text());
        }
      } catch (error) {
        console.error('❌ Error fetching room:', error);
      }
    };

    fetchRoom();
  }, [roomId]);

  // If no roomId, show error state
  if (!roomId) {
    return (
      <div className="flex flex-1 h-screen bg-white items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Room</h2>
          <p className="text-gray-600 mb-4">No room ID provided in the URL.</p>
          <Button
            color="primary"
            onClick={() => navigate("/")}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="flex flex-col flex-1 p-4">
        <header className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center relative">
          <div className="flex flex-1 justify-start">
            <Button
              color="red"
              onClick={() => {
                navigate("/");
                tearDownAudioGraph();
              }}
            >
              Exit Room
            </Button>
          </div>

          <div className="flex flex-1 justify-center">
            Test Room
          </div>
          <div className="flex flex-1 justify-end">
            <button className="text-gray-500 hover:text-blue-600 cursor-pointer" onClick={toggleChat}>Chat</button>
          </div>
        </header>
            
        <RoomMediaProvider>
            <RoomFeed 
              roomId={roomId}
            />
        </RoomMediaProvider>
      </div>
      {isChatOpen && roomId && (
        <div className="w-80 flex-col-1 border-l">
          <Chat 
            onClose={closeChat} 
            roomId={roomId}
            roomOwnerId={room?.created_by}
          />
        </div>
      )}
    </div>
  );
}
