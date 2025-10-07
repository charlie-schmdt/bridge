import { Card, CardBody } from "@heroui/react";
import Header from './components/Header';
import CallSettingsFooter from "./components/CallSettingsFooter";
import VideoFeed from "./VideoFeed";
import { useNavigate } from "react-router-dom";
import back_button from "@assets/back-button.png"
import {useVideoFeedContext, VideoFeedContext} from "./contexts/VideoFeedContext";
import { VideoFeedType } from "./contexts/VideoFeedContext";
import { useState } from "react";
import { VideoFeedProvider } from "./providers/VideoFeedProvider";

  
  interface RoomLayoutProps{}

export default function RoomLayout({}: RoomLayoutProps){  


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
              <VideoFeed />
        
            <CallSettingsFooter />
          </VideoFeedProvider>
          
          
      </CardBody>
    </Card>
  );
}
