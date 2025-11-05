import { Card } from "@heroui/react";
import Header from "./components/Header";
import { useAuth } from "./contexts/AuthContext";
import { useState, useEffect } from "react";
import MembersList from "./components/MemberList";
import { RoomCard } from "./components/RoomCard";
import { RoomCardProps } from "./components/RoomCard";
import NotificationBanner from "./components/NotificationBanner";
import { useParams } from "react-router-dom";
import LeaveWorkspaceButton from "./components/LeaveWorkspaceButton";
import { Endpoints } from "@/utils/endpoints";
import { Button } from "@heroui/react";

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  picture?: string;
  isOwner: boolean;
  role: string;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  members: WorkspaceMember[];
}

export const WorkspaceLayout = () => {
  const { user } = useAuth();
  const { workspaceId } = useParams<{ workspaceId: string }>(); // ← Get ID from URL
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    status?: string;
    next_meeting?: string;
  }>>([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');


  const isCurrentUserOwner = user && workspaceInfo?.members.find(
    member => member.id === user.id && member.isOwner
  );

  // Fetch workspace data using the ID from URL
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!user || !workspaceId) {
        console.log('Missing user or workspace ID:', { user: !!user, workspaceId });
        setLoading(false);
        return;
      }

      try {
        console.log(`🔍 Fetching data for workspace ID: ${workspaceId}`);
        
        const token = localStorage.getItem('bridge_token');
        const response = await fetch(`${Endpoints.WORKSPACE}/${workspaceId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const room_response = await fetch(`${Endpoints.WORKSPACE}/${workspaceId}/rooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch workspace data: ${response.status}`);
        }
        if (!room_response.ok) {
          throw new Error(`Failed to fetch room data: ${room_response.status}`);
        }

        const data = await response.json();
        const room_data = await room_response.json();

        if (data.success) {
          setWorkspaceInfo({
            id: data.workspaceId,
            name: data.workspaceName,
            members: data.members
          });
          setMembers(data.members);
          console.log('✅ Fetched workspace data:', {
            workspaceId: data.workspaceId,
            name: data.workspaceName,
            memberCount: data.members.length
          });
          if (room_data.success) {
            setRooms(room_data.rooms.filter(room => room.workspace_id === data.workspaceId));
            console.log('✅ Fetched room data:', {
              workspaceId: room_data.workspaceId,
              roomCount: room_data.rooms.length
            });
          } else {
            throw new Error(room_data.message || 'Failed to fetch room data');
          }
        } else {
          throw new Error(data.message || 'Failed to fetch workspace data');
        }

      } catch (err) {
        console.error('❌ Error fetching workspace data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch workspace data');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [user, workspaceId]); // ← Re-run when user or workspaceId changes

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert("Room name is required");
      return;
    }

    try {
      const token = localStorage.getItem('bridge_token');
      const response = await fetch(`${Endpoints.ROOMS}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId,          // Comes from useParams()
          name: roomName,
          description: roomDescription
        })
      });

      const data = await response.json();
      if (data.success) {
        setRooms(prev => [...prev, data.room]);
        setShowRoomModal(false);
        setRoomName('');
        setRoomDescription('');
      } else {
        console.error(data.message);
        alert(data.message);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room");
    }
  };

  

  // Loading state
  if (loading) {
    return (
      <Card className="min-h-screen bg-gray-50">
        <div className="workspace-app">
          <Header />
          <div className="mt-6 px-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading workspace...</p>
            <p className="text-sm text-gray-500">Workspace ID: {workspaceId}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="min-h-screen bg-gray-50">
        <div className="workspace-app">
          <Header />
          <div className="mt-6 px-6 text-center">
            <p className="text-red-600">{error}</p>
            <p className="text-gray-500 mt-2">Workspace ID: {workspaceId}</p>
          </div>
        </div>
      </Card>
    );
  }

  const handleMemberRemoved = (removedUserId: string) => {
  console.log(`Member ${removedUserId} removed from workspace`);
  
  // Update local state to remove the member
  setMembers(prevMembers => prevMembers.filter(member => member.id !== removedUserId));
  
  // Update workspace info if needed
  if (workspaceInfo) {
    setWorkspaceInfo(prev => prev ? {
      ...prev,
      members: prev.members.filter(member => member.id !== removedUserId)
    } : null);
  }
};


  return (
    <Card className="min-h-screen bg-white">
      <div className="workspace-app">
        {/* Header */}
        <Header />

        {/* Page title - now shows actual workspace name */}
        <div className="mt-6 px-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {workspaceInfo?.name || 'Workspace'}
          </h1>
          <p className="mt-6 text-gray-600 text-lg">
            Manage your team members, calls, and workspace access.
            {members.length > 0 && ` ${members.length} member${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {workspaceInfo && workspaceId && (
          <div>
              
              <div className="flex justify-between items-center mb-4 mt-6 px-6">
                <Button color="primary" onPress={setShowRoomModal.bind(null, true)}>
                  + Create Room
                </Button>
                <LeaveWorkspaceButton
                  workspaceId={workspaceId}
                  workspaceName={workspaceInfo.name}
                  isOwner={!!isCurrentUserOwner}
                  onLeaveSuccess={() => {
                    console.log('Left workspace successfully');
                  }}
                />
                
              </div>
              {showRoomModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                    <h2 className="text-2xl font-semibold mb-4">Create New Room</h2>

                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 mb-4"
                      placeholder="Enter room name"
                    />

                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={roomDescription}
                      onChange={(e) => setRoomDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 mb-4"
                      placeholder="Optional description"
                    />

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowRoomModal(false)}
                        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateRoom}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}

          </div>

        )}

        {/* Main content: Room cards + Members list */}
        <div className="flex flex-col lg:flex-row gap-6 mt-6 px-6 mb-4">
          {/* Left: Room cards (75%) */}
          <div className="lg:w-3/4 w-full">
            {rooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(10rem,_1fr)]">
                {rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    title={room.name}
                    description={room.description || 'No description provided'}
                    status={(room.status as "active" | "scheduled" | "offline") || 'offline'}
                    nextMeeting={room.next_meeting || 'TBA'}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center text-gray-500">
                No rooms yet. Create one to get started!
              </div>
            )}
          </div>

          {/* Right: Members list (25%) */}
          <div className="lg:w-1/4 w-full flex justify-end">
            <MembersList 
              members={members} 
              workspaceId={workspaceId}
              workspaceName={workspaceInfo?.name}
              onMemberRemoved={handleMemberRemoved}
            />          
          </div>
        </div>

      </div>
    </Card>
  );
};