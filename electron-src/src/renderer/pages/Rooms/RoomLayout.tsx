import { Card, CardBody } from "@heroui/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StreamChat } from 'stream-chat';
import Chat from "../../components/Chat";
import { useAudioContext } from "../../contexts/AudioContext";
import { RoomFeed } from "./RoomFeed";
import { RoomMediaProvider } from "./RoomMediaProvider";
import CallSettingsFooter from "./RoomSettingsFooter";

const apiKey = process.env.REACT_APP_STREAM_API_KEY || 'vv3fuvuqs5zw';
const test_user = {
  id: 'Test-user',
  name: 'INSERT TEST NAME HERE'
};

interface RoomLayoutProps{}

export const RoomLayout = ({}: RoomLayoutProps) => {
  const [isChatOpen, setIsChatOpen ] = useState(false);
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const { tearDownAudioGraph } = useAudioContext();
  
  const navigate = useNavigate();

  const { roomId } = useParams();

  useEffect(() => {
    async function init() {
      const chatClient = StreamChat.getInstance(apiKey || '');

      try {
        await chatClient.connectUser(test_user, chatClient.devToken(test_user.id));

        const chatChannel = chatClient.channel('messaging', 'test-room', {
          name: 'Room',
          members: [test_user.id]
        } as any);
        
        setChannel(chatChannel);
        setClient(chatClient);
        console.log('StreamChat initialized with test user:', test_user);
      }
      catch (error) {
        console.error('StreamChat initialization error:', error);
      }
    }

    init();
  }, []);


  return (
    <Card>
      <CardBody>
          <header className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
              <button
                className="text-white bg-red-600 font-medium hover:text-black cursor-pointer px-2"
                onClick={() => {
                  navigate("/");
                  tearDownAudioGraph();
                }}
                // onClick={() => navigate(`/workspace/${workspaceId}`)}
              >
                Exit Room
              </button>
                

              <div className = "absolute left-1/2 transform -translate-x-1/2">
                Test Room
              </div>

          </header>
          
          <RoomMediaProvider>
            <div className="flex-1">
              <RoomFeed 
                streamChatClient={client}
                streamChatChannel={channel}
                roomId={roomId}
              />
            </div>
            <CallSettingsFooter onOpenChat={openChat} />
            
            <Chat 
            isOpen={isChatOpen} 
            onClose={closeChat} 
            client={client}
            channel={channel}
            />
          </RoomMediaProvider>
      </CardBody>
    </Card>
  );
}
