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
        const response = await fetch(`http://localhost:3000/api/workspace/${workspaceId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch workspace data: ${response.status}`);
        }

        const data = await response.json();
        
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

  const roomCardProps: RoomCardProps = {
    title: "Test Room",
    description: "This is a test room",
    status: "active",
    nextMeeting: "Tomorrow at 10 AM",
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

  return (
    <Card className="min-h-screen bg-gray-50">
      <div className="workspace-app">
        {/* Header */}
        <Header />

        {/* Page title - now shows actual workspace name */}
        <div className="mt-6 px-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {workspaceInfo?.name || 'Workspace'}
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Manage your team members, calls, and workspace access.
            {members.length > 0 && ` ${members.length} member${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {workspaceInfo && workspaceId && (
              <LeaveWorkspaceButton
                workspaceId={workspaceId}
                workspaceName={workspaceInfo.name}
                isOwner={!!isCurrentUserOwner}
                onLeaveSuccess={() => {
                  console.log('Left workspace successfully');
                }}
              />
            )}


        {/* Notification Banner */}
        <div className="mt-6 px-6">
          <NotificationBanner message="This is a notification banner!" />
        </div>

        {/* Main content: Room cards + Members list */}
        <div className="mt-6 px-6 flex flex-col lg:flex-row gap-6">
          {/* Left: Room cards (75%) */}
          <div className="lg:w-3/4 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <RoomCard {...roomCardProps} />
            <RoomCard {...roomCardProps} />
            <RoomCard {...roomCardProps} />
          </div>

          {/* Right: Members list (25%) */}
          <div className="lg:w-1/4 w-full">
            <MembersList members={members} />
          </div>
        </div>
      </div>
    </Card>
  );
};