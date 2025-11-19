
import { VideoPlayer, VideoPlayerProps } from './VideoPlayer';

export interface VideoGridProps {
  streams: VideoPlayerProps[];
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

export const VideoGrid = ({ streams }: VideoGridProps) => {
  return (
    <div className="flex flex-col w-full h-full gap-4 p-4">
      {renderGrid(streams)}
    </div>
  );
};