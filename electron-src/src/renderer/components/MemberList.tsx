import { useAuth } from "../contexts/AuthContext";
import RemoveUserButton from './RemoveUserButton';

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
  role: string;
}

interface MembersListProps {
  members: Member[];
  workspaceId?: string;
  workspaceName?: string;
  onMemberRemoved?: (userId: string) => void;
}

export default function MembersList({ members, workspaceId, workspaceName, onMemberRemoved }: MembersListProps) {
    const { user } = useAuth();
  
  // Check if current user is owner
  const currentUserOwner = members.find(member => member.id === user?.id && member.isOwner);
  const isCurrentUserOwner = !!currentUserOwner;

  return (
    <div className="bg-white rounded-xl shadow p-4 w-64">
      <h3 className="font-semibold mb-4">Members ({members.length})</h3>
      <ul className="space-y-2">
        {members.map((member, i) => (
          <li key={member.id || i} className="text-gray-800">
            {member.name}
            {workspaceId && (
              <RemoveUserButton
                workspaceId={workspaceId}
                userId={member.id}
                userName={member.name}
                isCurrentUserOwner={isCurrentUserOwner}
                isTargetUserOwner={member.isOwner}
                onRemoveSuccess={onMemberRemoved}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
