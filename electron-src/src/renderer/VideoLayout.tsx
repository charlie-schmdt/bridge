import { VideoFeed } from './VideoFeed';
import { Card, CardBody } from "@heroui/react";

export const VideoLayout = () => {
    return (
        <Card>
            <CardBody>
                <VideoFeed />
            </CardBody>
        </Card>
    );
}