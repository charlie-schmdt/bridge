import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext";
import RemoveUserButton from './RemoveUserButton';
import MemberProfilePopover from './MemberProfilePopover';

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
}

interface MembersListProps {
  members: Member[];
  workspaceId?: string;
  workspaceName?: string;
  onMemberRemoved?: (userId: string) => void;
}

export default function MembersList({ members, workspaceId, workspaceName, onMemberRemoved }: MembersListProps) {
    const { user } = useAuth();
    const [hoveredMember, setHoveredMember] = useState<Member | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

    // Check if current user is owner
    const currentUserOwner = members.find(member => member.id === user?.id && member.isOwner);
    const isCurrentUserOwner = !!currentUserOwner;

    const handleMouseEnter = (e: React.MouseEvent, member: Member) => {
      // entering member: cancel any pending close
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
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

    const handleMouseLeave = () => startCloseTimer();

    useEffect(() => {
      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      };
    }, []);

    return (
    <div ref={containerRef} className="bg-white rounded-xl shadow p-4 w-64">
      <h3 className="font-semibold mb-4">Members ({members.length})</h3>
      <ul className="space-y-2">
        {members.map((member, i) => (
          <li key={member.id || i} className="text-gray-800 flex items-center justify-between" onMouseEnter={(e) => handleMouseEnter(e, member)} onMouseLeave={handleMouseLeave}>
            <div className="flex items-center gap-2">
              <img src={member.picture || ''} alt={member.name} className="w-8 h-8 rounded-full object-cover bg-neutral-100" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{member.name}</span>
                <span className="text-xs text-neutral-500">{member.role || 'Member'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {workspaceId && (
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
    </div>
  );
}
