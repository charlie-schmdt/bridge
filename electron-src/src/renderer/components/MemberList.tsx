import { Endpoints } from "@/renderer/utils/endpoints";
import { Button } from "@heroui/react";
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from "../contexts/AuthContext";
import MemberProfilePopover from './MemberProfilePopover';
import RemoveUserButton from './RemoveUserButton';

const statusColors = {
  online: "text-green-600",
  offline: "text-red-600",
  away: "text-yellow-600",
};

interface Member {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  isOwner?: boolean;
  role?: string;
  permissions?: {
    canCreateRooms?: boolean;
    canDeleteRooms?: boolean;
    canEditWorkspace?: boolean;
  };
}

interface MembersListProps {
  members: Member[];
  workspaceId?: string;
  workspaceName?: string;
  onMemberRemoved?: (userId: string) => void;
  isEditing?: boolean;
}

export default function MembersList({ members, workspaceId, workspaceName, onMemberRemoved, isEditing }: MembersListProps) {
  const { user } = useAuth();
  const [hoveredMember, setHoveredMember] = useState<Member | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  // Permissions modal state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [canCreateRooms, setCanCreateRooms] = useState(false);
  const [canDeleteRooms, setCanDeleteRooms] = useState(false);
  const [canEditWorkspace, setCanEditWorkspace] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Check if current user is owner
  const currentUserOwner = members.find(member => member.id === user?.id && member.isOwner);
  const isCurrentUserOwner = !!currentUserOwner;

  const handleMouseEnter = (e: React.MouseEvent, member: Member) => {
    // Only show popover if not hovering over buttons
    const target = e.target as HTMLElement;
    const isButton = target.closest('button') || target.closest('[role="button"]');
    
    if (isButton) {
      // Don't show popover when hovering over buttons
      return;
    }

    // entering member: cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const currentTarget = e.currentTarget as HTMLElement;
    const rect = currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setHoveredMember(member);
  };

  const startCloseTimer = () => {
    // small delay so popover can be clicked
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setHoveredMember(null);
      setAnchorRect(null);
      closeTimeoutRef.current = null;
    }, 150) as unknown as number;
  };

  const clearCloseTimer = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Don't close if moving to buttons
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isMovingToButton = relatedTarget?.closest('button') || relatedTarget?.closest('[role="button"]');
    
    if (!isMovingToButton) {
      startCloseTimer();
    }
  };

  // Get user permissions from backend
  const getUserPermissions = async (workspaceId: string, memberId: string) => {
    try {
      const token = localStorage.getItem("bridge_token");
      const response = await fetch(`${Endpoints.WORKSPACES}/${workspaceId}/permissions/${memberId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        console.log("Permissions fetched successfully");
        return data.permissions;
      } else {
        alert(data.message || "Failed to fetch permissions");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching permissions");
    }
  };

  const handleEditPermissions = (member: Member) => {
    // Close popover when editing permissions
    setHoveredMember(null);
    setAnchorRect(null);
    
    getUserPermissions(workspaceId!, member.id).then((permissions) => {
      if (permissions) {
        setCanCreateRooms(permissions.canCreateRooms || false);
        setCanDeleteRooms(permissions.canDeleteRooms || false);
        setCanEditWorkspace(permissions.canEditWorkspace || false);
      }
      setEditingMember(member);
      setShowPermissionsModal(true);
    });
  };

  const saveUserPermissions = async (userId: string, permissions: { canCreateRooms: boolean, canDeleteRooms: boolean, canEditWorkspace: boolean }) => {
    try {
      const token = localStorage.getItem("bridge_token");
      const response = await fetch(`${Endpoints.WORKSPACES}/${workspaceId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, permissions }),
      });
      const data = await response.json();
      if (data.success) {
        console.log("Permissions updated successfully", data.permissions);
      } else {
        alert(data.message || "Failed to update permissions");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating permissions");
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow p-4 w-full">
      <h3 className="font-semibold mb-4">Members ({members.length})</h3>
      <ul className="space-y-2">
        {members.map((member, i) => (
          <li 
            key={member.id || i} 
            className="text-gray-800 flex items-center justify-between group" 
            onMouseEnter={(e) => handleMouseEnter(e, member)} 
            onMouseLeave={handleMouseLeave}
          >
            {/* Left side - Member info (hoverable area) */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img 
                src={member.picture || ''} 
                alt={member.name} 
                className="w-8 h-8 rounded-full object-cover bg-neutral-100" 
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{member.name}</span>
                <span className="text-xs text-neutral-500">{member.role || 'Member'}</span>
              </div>
            </div>

            {/* Right side - Buttons (non-hoverable area for popover) */}
            <div 
              className="flex items-center gap-2 ml-2"
              onMouseEnter={() => {
                // Clear popover when hovering over buttons
                setHoveredMember(null);
                setAnchorRect(null);
              }}
            >
              {workspaceId && isEditing && (
                <>
                  <RemoveUserButton
                    workspaceId={workspaceId}
                    userId={member.id}
                    userName={member.name}
                    isCurrentUserOwner={isCurrentUserOwner}
                    isTargetUserOwner={!!member.isOwner}
                    onRemoveSuccess={onMemberRemoved}
                  />
                  <Button
                    size="sm"
                    onPress={() => handleEditPermissions(member)}
                    className="text-xs px-2 py-1 h-6 bg-blue-50"
                  >
                    Edit
                  </Button>
                </>
              )}
              {workspaceId && !isEditing && (
                <RemoveUserButton
                  workspaceId={workspaceId}
                  userId={member.id}
                  userName={member.name}
                  isCurrentUserOwner={isCurrentUserOwner}
                  isTargetUserOwner={!!member.isOwner}
                  onRemoveSuccess={onMemberRemoved}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Popover mounted at root of this card */}
      {hoveredMember && anchorRect && (
        <MemberProfilePopover
          member={hoveredMember}
          anchorRect={anchorRect}
          onRequestClose={() => { setHoveredMember(null); setAnchorRect(null); }}
          onMouseEnter={() => clearCloseTimer()}
          onMouseLeave={() => startCloseTimer()}
        />
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">
              Edit Permissions for {editingMember.name}
            </h2>

            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={canCreateRooms}
                onChange={(e) => setCanCreateRooms(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Allow user to create rooms</span>
            </label>

            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={canDeleteRooms}
                onChange={(e) => setCanDeleteRooms(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Allow user to delete rooms</span>
            </label>

            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={canEditWorkspace}
                onChange={(e) => setCanEditWorkspace(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Allow user to edit workspace</span>
            </label>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                size="sm"
                onPress={() => setShowPermissionsModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onPress={() => {
                  saveUserPermissions(editingMember.id, {
                    canCreateRooms,
                    canDeleteRooms,
                    canEditWorkspace
                  });
                  setShowPermissionsModal(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}