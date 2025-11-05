import { useAuth } from "../contexts/AuthContext";
import RemoveUserButton from './RemoveUserButton';
import { Button } from "@heroui/react";
import { useState } from "react";
import { Endpoints } from "@/utils/endpoints";


const statusColors = {
  online: "text-green-600",
  offline: "text-red-600",
  away: "text-yellow-600",
};

interface Member {
  id: string;
  name: string;
  email: string;
  picture?: string;
  isOwner: boolean;
  role: string; // can stay for display purposes
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
  
  // Check if current user is owner
  const currentUserOwner = members.find((member) => member.id === user?.id && member.isOwner);
  const isCurrentUserOwner = !!currentUserOwner;
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [canCreateRooms, setCanCreateRooms] = useState(false);
  const [canDeleteRooms, setCanDeleteRooms] = useState(false);
  const [canEditWorkspace, setCanEditWorkspace] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

const handleEditPermissions = (member: Member) => {
  setEditingMember(member);
  setCanCreateRooms(member.permissions?.canCreateRooms || false);
  setCanDeleteRooms(member.permissions?.canDeleteRooms || false);
  setCanEditWorkspace(member.permissions?.canEditWorkspace || false);
  setShowPermissionsModal(true);
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
      console.log("Permissions updated successfully");
    } else {
      alert(data.message || "Failed to update permissions");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating permissions");
  }
};




  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      <h3 className="font-semibold mb-4">Members ({members.length})</h3>
      <ul className="space-y-2 gap-3">
        {members.map((member, i) => (
          <li key={member.id || i} className="text-gray-800 flex justify-between items-center">
            {member.name}
            {workspaceId && isEditing && (
              <div>
              <RemoveUserButton
                workspaceId={workspaceId}
                userId={member.id}
                userName={member.name}
                isCurrentUserOwner={isCurrentUserOwner}
                isTargetUserOwner={member.isOwner}
                onRemoveSuccess={onMemberRemoved}
              />
              <Button
                size="sm"
                onPress={() => handleEditPermissions(member)}
                className="text-xs px-2 py-1 h-6 bg-blue-50"
              >
                Edit
              </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
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


            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                onPress={() => setShowPermissionsModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onPress={() => {
                  // Call backend to save permission changes
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
