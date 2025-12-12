import { Button } from '@/renderer/components/ui/Button';
import { Endpoints } from '@/utils/endpoints';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "../../components/Chat";
import TranscriptionWindow from '@/renderer/components/TranscriptionWindow';
import { useAudioContext } from "../../contexts/AudioContext";
import { RoomFeed } from "./RoomFeed";
import { RoomMediaProvider } from "./RoomMediaProvider";

interface RoomLayoutProps{}

interface Room {
  room_id: string;
  name: string;
  created_by: string;
  attendeeId: string;
  // ... other fields
}

export const RoomLayout = ({}: RoomLayoutProps) => {
  const [isChatOpen, setIsChatOpen ] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const { tearDownAudioGraph } = useAudioContext();
  const toggleChat = () => setIsChatOpen(prevIsChatOpen => !prevIsChatOpen);

  const [isTranscriptOpen, setIsTranscriptOpen ] = useState(false);
  const openTranscript = () => setIsTranscriptOpen(true);
  const closeTranscript = () => setIsTranscriptOpen(false);
  const toggleTranscript = () => setIsTranscriptOpen(prevIsTranscriptOpen => !prevIsTranscriptOpen);

  const navigate = useNavigate();

  const { roomId } = useParams<{ roomId: string }>();

  // Fetch room details to get created_by (owner)
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) return;
      
      try {
        console.log('🔍 Fetching room details for:', roomId);
        const response = await fetch(`${Endpoints.ROOMS}/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('bridge_token')}`
          }
        });
        
        console.log('📡 Room fetch response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Room data received:', data);
          setRoom(data.room);
        } else {
          console.error('❌ Failed to fetch room:', response.status, await response.text());
        }
      } catch (error) {
        console.error('❌ Error fetching room:', error);
      }
    };

    fetchRoom();
  }, [roomId]);

    const [attendeeId, setAttendeeId] = useState(null);

    const getUserTimes = async (attId) => {
    try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(`${Endpoints.ATTENDANCE}/${attId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch user attendance entry");
        }
        const data = await response.json();
        if (data) {
            console.log("GETTING USER TIMES RESPONSE: ", data)
            return [data.last_entered, data.total_time]
        }
    } catch (error) {
        
    }
    };
    const minutesInCall = async (start, end) => {
        const start_date = new Date(start);
        const end_date = new Date(end);
        const start_time = start_date.getTime();
        const end_time = end_date.getTime();
        const mins = (end_time - start_time) / 1000 /60;
        console.log("rounded: ", Math.round(mins))
        return Math.round(mins);
    };
    const userExitedSession = async (attId, len, time) => {
      const lastExited = new Date().toISOString();
      const curr_time = await minutesInCall(len, lastExited);
      const total_time = Number(time) + Number(curr_time);
      console.log("totalling time: ", total_time)
      try {
          const token = localStorage.getItem("bridge_token");
          const response = await fetch(`${Endpoints.ATTENDANCE}/updateAttendance/${attId}`, {
              method: "PUT",
              headers: {
              'Authorization': `Bearer ${token}`,
              "Content-Type": "application/json",
              },
              body:  JSON.stringify({
                  update_type: "left",
                  last_exited: lastExited,
                  total_time: total_time
              })
          });
          const data = await response.json();
          if (data.success) {
              console.log("✅ Updated attendance entry successfully:", data);
          } else {
  
          }
      } catch (error) {
          console.log("ERROR: ",error)
      }
  
    };
    const data_exit = async (attendee_id) => {
      console.log("Attempting to exit here's the id ", attendee_id);
    
      if (attendee_id) {
          const [len, time] = await getUserTimes(attendee_id)
          await userExitedSession(attendee_id, len, time);
      }
    };
    const handleAdmitted = async (attendanceId) => {
      console.log("RL~ HERE SHE IS: ", attendanceId)
      setAttendeeId(attendanceId);
    };

          console.log("RL~ HERE SHE IS: (within)", attendeeId)


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
                data_exit(attendeeId);
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
            <button className="text-gray-500 hover:text-blue-600 cursor-pointer" onClick={toggleTranscript}>Transcript</button>
          </div>
          <div className="flex flex-1 justify-end">
            <button className="text-gray-500 hover:text-blue-600 cursor-pointer" onClick={toggleChat}>Chat</button>
          </div>
        </header>
            
        <RoomMediaProvider>
            <RoomFeed 
              roomId={roomId}
              updateAttendeeId={handleAdmitted}
            />
        </RoomMediaProvider>
      </div>
      {isTranscriptOpen && roomId && (
        <div className="w-80 flex-col-1 border-l">
          <TranscriptionWindow 
          />
        </div>
      )}
      {isChatOpen && roomId && (
        <div className="w-80 flex-col-1 border-l">
          <Chat 
            onClose={closeChat} 
            roomId={roomId}
            roomOwnerId={room?.created_by}
          />
        </div>
      )}
    </div>
  );
}
