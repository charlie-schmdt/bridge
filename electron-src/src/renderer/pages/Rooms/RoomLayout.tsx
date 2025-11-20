import { Button } from '@/renderer/components/ui/Button';
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "../../components/Chat";
import { useAudioContext } from "../../contexts/AudioContext";
import { RoomFeed } from "./RoomFeed";
import { RoomMediaProvider } from "./RoomMediaProvider";
import { RoomSettingsFooter } from "./RoomSettingsFooter";

interface RoomLayoutProps{}

export const RoomLayout = ({}: RoomLayoutProps) => {
  const [isChatOpen, setIsChatOpen ] = useState(false);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const { tearDownAudioGraph } = useAudioContext();
  
  const navigate = useNavigate();

  const { roomId } = useParams<{ roomId: string }>();

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
    <div className="flex flex-1 h-screen bg-white">
      <div className="flex flex-col flex-1 p-4">
        <header className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
            <Button
              color="red"
              onClick={() => {
                navigate("/");
                tearDownAudioGraph();
              }}
            >
              Exit Room
            </Button>


            <div className = "absolute left-1/2 transform -translate-x-1/2">
              Test Room
            </div>

        </header>
            
        <RoomMediaProvider>
            <RoomFeed 
              roomId={roomId}
            />
          <RoomSettingsFooter onOpenChat={openChat} />
        </RoomMediaProvider>
      </div>
      {isChatOpen && roomId && (
        <div className="w-80 flex-col-1 border-l">
          <Chat 
            onClose={closeChat} 
            roomId={roomId}
          />
        </div>
      )}
    </div>
  );
}
