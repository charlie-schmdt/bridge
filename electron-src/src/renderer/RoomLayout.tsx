import { Card, CardBody } from "@heroui/react";
import Header from './components/Header';
import CallSettingsFooter from "./components/CallSettingsFooter";
import VideoFeed from "./VideoFeed";
import { useParams, useNavigate } from "react-router-dom";
import back_button from "@assets/back-button.png"
import {useVideoFeedContext, VideoFeedContext} from "./contexts/VideoFeedContext";
import { VideoFeedType } from "./contexts/VideoFeedContext";
import React, { useContext, useState, useEffect, useRef } from "react";
import { VideoFeedProvider } from "./providers/VideoFeedProvider";
import Chat from "./components/Chat";
import { StreamChat } from 'stream-chat';

const apiKey = process.env.REACT_APP_STREAM_API_KEY || 'vv3fuvuqs5zw';
const test_user = {
  id: 'Test-user',
  name: 'INSERT TEST NAME HERE'
};
type callStatus = "active" | "inactive" | "loading";

interface RoomLayoutProps{}

export default function RoomLayout({}: RoomLayoutProps){  
  const VFref = useRef();
  const [isChatOpen, setIsChatOpen ] = useState(false);
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const [callStatus, setCallStatus] = useState<callStatus>("loading");
  

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
          {/*
          <VideoFeed />
          <CallerGallery />
          
          <Header />
          */}
          <header className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
              <button
                className="text-white bg-red-600 font-medium hover:text-black cursor-pointer px-2"
                onClick={() => navigate("/")}
                // onClick={() => navigate(`/workspace/${workspaceId}`)}
              >
                Exit Room
              </button>
                

              <div className = "absolute left-1/2 transform -translate-x-1/2">
                Test Room
              </div>

          </header>
          
          <VideoFeedProvider>
            <div className="flex-1">
              <VideoFeed 
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
            
            
          </VideoFeedProvider>

          
      </CardBody>
    </Card>
  );
}
