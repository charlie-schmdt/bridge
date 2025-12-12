import { VideoLayout } from '@/renderer/types/roomTypes';
import { VideoPlayer, VideoPlayerProps } from './VideoPlayer';

export interface VideoGridProps {
  layout: VideoLayout;
  streams: VideoPlayerProps[];
  screenStream?: VideoPlayerProps;
}

/**
 * Renders a single row of video players.
 * Each player will expand to fill the available space in the row.
 */
const Row = ({ streams }: { streams: VideoPlayerProps[] }) => (
  <div className="flex flex-1 justify-center items-center min-h-0 gap-4">
    {streams.map(({ stream, isMuted }) => (
      <div key={stream.id} className="h-full aspect-video overflow-hidden rounded-lg bg-black">
        <VideoPlayer stream={stream} isMuted={isMuted} />
      </div>
    ))}
  </div>
);

const renderGrid = (streams: VideoPlayerProps[]) => {
  const participantCount = streams.length;

  if (participantCount <= 0) {
    return null; // No participants, render nothing.
  }

  // Single row for 1-2 participants
  if (participantCount <= 2) {
    return <Row streams={streams} />;
  }

  // 2-row grid for 3-6 participants
  if (participantCount <= 6) {
    const half = Math.ceil(participantCount / 2);
    const topRow = streams.slice(0, half);
    const bottomRow = streams.slice(half);
    return (
      <>
        <Row streams={topRow} />
        <Row streams={bottomRow} />
      </>
    );
  }

  // 3-row grid for 7-9 participants
  const topRow = streams.slice(0, 3);
  const middleRow = streams.slice(3, 6);
  const bottomRow = streams.slice(6, 9);
  return (
    <>
      <Row streams={topRow} />
      <Row streams={middleRow} />
      <Row streams={bottomRow} />
    </>
  );
};

const renderSpeaker = (streams: VideoPlayerProps[], screenStream: VideoPlayerProps) => {
  if (streams.length === 0) { // No streams, render nothing
    return null;
  }
  const displayStreams = [...streams];
  if (!screenStream.stream) {
    if (streams.length === 1) {
      return renderGrid(streams);
    }
    screenStream = displayStreams[0];
    displayStreams.splice(0, 1);
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Horizontally scrollable bar for other participants at the top */}
      <div className="flex-shrink-0 w-full overflow-x-auto flex justify-center">
        <div className="flex space-x-2 h-22"> {/* Fixed height for the top bar */}
          {displayStreams.map(({ stream, isMuted }) => (
            <div key={stream.id} className="h-full aspect-video rounded-md overflow-hidden bg-black">
              <VideoPlayer stream={stream} isMuted={isMuted} />
            </div>
          ))}
        </div>
      </div>
      {/* Centralized view for the main screen/speaker */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        {screenStream && (
          <div className="max-w-full max-h-full aspect-video overflow-hidden rounded-lg bg-black">
            {/* The screen share is always muted for the local user to prevent audio feedback */}
            <VideoPlayer stream={screenStream.stream} isMuted={screenStream.isMuted} />
          </div>
        )}
      </div>
    </div>
  );
}

export const VideoGrid = ({ layout, streams, screenStream }: VideoGridProps) => {
  return (
    <div className="flex flex-col w-full h-full gap-4 p-4">
      {layout === 'speaker' ? renderSpeaker(streams, screenStream) : renderGrid(streams)}
    </div>
  );
};