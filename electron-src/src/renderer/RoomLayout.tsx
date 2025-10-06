import { Card, CardBody } from "@heroui/react";
import Header from './components/Header';
import CallSettingsFooter from "./components/CallSettingsFooter";
import { VideoFeed } from './VideoFeed';

export const RoomLayout = () => {

  return (
    <Card>
      <CardBody>
          {/*
          <VideoFeed />
          <CallerGallery />
          */}
          <Header />
          <h1>Test Room</h1>
          <VideoFeed />
          <CallSettingsFooter />
          
          
      </CardBody>
    </Card>
  );
}
