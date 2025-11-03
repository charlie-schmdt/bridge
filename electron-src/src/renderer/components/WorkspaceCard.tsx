import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdClass } from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle, Plus, Users } from "lucide-react";

interface WorkspaceCardProps {
  id: number; // Add workspace ID
  title: string;
  description: string;
  nextMeeting?: string;
  members: number;
  authorizedUsers?: string[]; // Add authorized users list
  isPrivate?: boolean; // Add privacy status
  onJoinSuccess?: () => void; // Callback for when join is successful
}

export default function WorkspaceCard({ 
  id,
  title, 
  description, 
  nextMeeting, 
  members,
  authorizedUsers = [],
  isPrivate = false,
  onJoinSuccess
}: WorkspaceCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(
    user ? authorizedUsers.includes(user.id) : false
  );

  const handleJoinWorkspace = async () => {
    if (!user) {
      setJoinError("You must be logged in to join a workspace");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const token = localStorage.getItem('bridge_token');
      console.log(user);
      
      const response = await fetch('http://localhost:3000/api/workspace/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: id,
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsJoined(true);
        console.log('✅ Successfully joined workspace:', title);
        
        // Call callback if provided
        if (onJoinSuccess) {
          onJoinSuccess();
        }
        
        // After successful join, navigate to workspace
        setTimeout(() => {
          navigate(`/workspace/${id}`);
        }, 1000);
        
      } else {
        throw new Error(data.message || 'Failed to join workspace');
      }

    } catch (error) {
      console.error('❌ Join workspace error:', error);
      setJoinError(error instanceof Error ? error.message : 'Failed to join workspace');
    } finally {
      setIsJoining(false);
    }
  };

  const handleEnterWorkspace = () => {
    navigate(`/workspace/${id}`);
  };

  return (
    <div className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 p-4 flex flex-col justify-between border border-gray-100">
      
      {/* Header with icon and privacy indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MdClass className="text-blue-600" size={28} />
          {isPrivate && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Private
            </span>
          )}
        </div>
        
        {isJoined && (
          <CheckCircle className="text-green-500" size={20} />
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
      
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
        <button
          onClick={handleEnterWorkspace}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
        >
          <CheckCircle size={16} />
          Enter Workspace
        </button>
      ) : (
        <button
          onClick={handleJoinWorkspace}
          disabled={isJoining}
          className={`w-full py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium ${
            isJoining
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
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
        </button>
      )}

      {/* Footer info */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>{members} members</span>
        </div>
        {nextMeeting && (
          <div>
            Next: {nextMeeting}
          </div>
        )}
      </div>
    </div>
  );
}