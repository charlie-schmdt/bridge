import { Card, CardBody } from "@heroui/react";
import Header from './components/Header';
import CallSettingsFooter from "./components/CallSettingsFooter";
import VideoFeed from "./VideoFeed";
import { useNavigate } from "react-router-dom";
import back_button from "@assets/back-button.png"
import {useVideoFeedContext, VideoFeedContext} from "./contexts/VideoFeedContext";
import { VideoFeedType } from "./contexts/VideoFeedContext";
import { useContext, useState } from "react";
import { VideoFeedProvider } from "./providers/VideoFeedProvider";
import Chat from "./components/Chat";

  
  interface RoomLayoutProps{}

export default function RoomLayout({}: RoomLayoutProps){  
  const [isChatOpen, setIsChatOpen ] = useState(false);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  const navigate = useNavigate();
  
  
  


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
                className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <img src={back_button} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />
              </button>
          </header>
          <h1>Test Room</h1>
          
          <VideoFeedProvider>
            <div className="flex-1">
              <VideoFeed />
            </div>
            <CallSettingsFooter onOpenChat={openChat} />
            <Chat isOpen={isChatOpen} onClose={closeChat} />
          </VideoFeedProvider>

          
      </CardBody>
    </Card>
  );
}
