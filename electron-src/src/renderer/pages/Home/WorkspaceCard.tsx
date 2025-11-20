import { Endpoints } from "@/renderer/utils/endpoints";
import { CheckCircle, Lock, Plus, Users } from "lucide-react";
import { useState } from "react";
import { MdClass } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import FavoriteButton from "./FavoriteButton";
import { Button } from "@/renderer/components/ui/Button";

interface WorkspaceCardProps {
  id: number;
  title: string;
  description: string;
  nextMeeting?: string;
  members: number;
  authorizedUsers?: string[];
  blockedUsers?: string[];
  isPrivate?: boolean;
  isFavorite?: boolean;
  onJoinSuccess?: () => void; // Callback for when join is successful
  onFavoriteToggle?: (workspaceId: string, isFavorite: boolean) => void;
}

export default function WorkspaceCard({
  id,
  title,
  description,
  nextMeeting,
  members,
  authorizedUsers = [],
  blockedUsers = [],
  isPrivate = false,
  isFavorite = false,
  onJoinSuccess,
  onFavoriteToggle,
}: WorkspaceCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(
    user ? authorizedUsers.includes(user.id) : false
  );
  // Determine if user is blocked from this workspace
  const isBlocked = blockedUsers.includes(String(user.id));


  console.log("Blocked users:", blockedUsers);
  if (isBlocked) {
    console.log(`User ${user?.id} is blocked from workspace ${id}`);
  }


  const handleJoinWorkspace = async () => {
    if (!user) {
      setJoinError("You must be logged in to join a workspace");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const token = localStorage.getItem("bridge_token");
      console.log(user);

      const response = await fetch(Endpoints.WORKSPACE_JOIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId: id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsJoined(true);
        console.log("✅ Successfully joined workspace:", title);

        // Call callback if provided
        if (onJoinSuccess) {
          onJoinSuccess();
        }

        // After successful join, navigate to workspace
        setTimeout(() => {
          navigate(`/workspace/${id}`);
        }, 1000);
      } else {
        throw new Error(data.message || "Failed to join workspace");
      }
    } catch (error) {
      console.error("❌ Join workspace error:", error);
      setJoinError(
        error instanceof Error ? error.message : "Failed to join workspace"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleEnterWorkspace = () => {
    navigate(`/workspace/${id}`);
  };

  return (
    <div className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 p-4 flex flex-col justify-between border border-gray-100">
      {/* Header with icon, privacy indicator, and favorite button */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MdClass className="text-blue-600" size={28} />
          {isPrivate && (
            <div className="flex items-center gap-1">
              <Lock size={14} className="text-yellow-600" />
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Private
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Only show favorite button if user is a member */}
          {isJoined && (
            <FavoriteButton
              workspaceId={id.toString()}
              isFavorite={isFavorite}
              onFavoriteToggle={onFavoriteToggle}
            />
          )}

          {isJoined && <CheckCircle className="text-green-500" size={20} />}
        </div>
      </div>

      {/* Title with favorite indicator */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-lg text-gray-900 flex-1">{title}</h3>
        {isFavorite && (
          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">
            ⭐ Favorite
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 flex-grow">{description}</p>

      {/* Error message */}
      {joinError && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {joinError}
        </div>
      )}

      {/* Action Button */}
      {isJoined ? (
        <Button
          onClick={!isBlocked ? handleEnterWorkspace : undefined}
          disabled={isBlocked}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 font-medium 
            ${isBlocked
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
            }`}
        >
          {isBlocked ? (
            "Unable to join at this time"
          ) : (
            <>
              <CheckCircle size={16} />
              Enter Workspace
            </>
          )}
        </Button>

      ) : (
        <Button
          onClick={handleJoinWorkspace}
          disabled={isJoining}
          className={`w-full py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium ${
            isJoining
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isJoining ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Joining...
            </>
          ) : (
            <>
              <Plus size={16} />
              Join Workspace
            </>
          )}
        </Button>
      )}

      {/* Footer info */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>{members} members</span>
        </div>
        {nextMeeting && <div>Next: {nextMeeting}</div>}
      </div>
    </div>
  );
}
