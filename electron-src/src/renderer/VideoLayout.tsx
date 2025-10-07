import Header from './components/Header';
//import { VideoFeed } from './VideoFeed';
import { Card, CardBody } from "@heroui/react";

export const VideoLayout = () => {
    return (
        <Card>
            <CardBody>
                <Header />
                {/*<VideoFeed />*/}
            </CardBody>
        </Card>
    );
}
