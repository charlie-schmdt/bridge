import { Button } from '@/renderer/components/ui/Button';
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "../../components/Chat";
import { useAudioContext } from "../../contexts/AudioContext";
import { RoomFeed } from "./RoomFeed";
import { RoomMediaProvider } from "./RoomMediaProvider";

interface RoomLayoutProps{}

export const RoomLayout = ({}: RoomLayoutProps) => {
  const [isChatOpen, setIsChatOpen ] = useState(false);
<<<<<<< HEAD
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
=======
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
>>>>>>> 327557cce2b278dd0cd08b09b68d7da00950a6e1
  const { tearDownAudioGraph } = useAudioContext();

  const closeChat = () => setIsChatOpen(false);
  const toggleChat = () => setIsChatOpen(prevIsChatOpen => !prevIsChatOpen);

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
<<<<<<< HEAD
            onClose={closeChat} 
            roomId={roomId}
=======
          closeChat={closeChat} 
          toggleChat={toggleChat} 
          client={client}
          channel={channel}
>>>>>>> 327557cce2b278dd0cd08b09b68d7da00950a6e1
          />
        </div>
      )}
    </div>
  );
}
