import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Member {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  isOwner?: boolean;
  role?: string;
}

interface Props {
  member: Member;
  anchorRect: DOMRect | null;
  onRequestClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const MemberProfilePopover: React.FC<Props> = ({ member, anchorRect, onRequestClose, onMouseEnter, onMouseLeave }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onRequestClose();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onRequestClose]);

  if (!anchorRect) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(window.innerWidth - 320 - 12, Math.max(12, anchorRect.right + 8)),
    top: Math.max(12, anchorRect.top - 8),
    width: 320,
    zIndex: 99999,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="bg-white rounded-lg shadow-lg border border-neutral-200 p-3"
      onMouseEnter={() => onMouseEnter && onMouseEnter()}
      onMouseLeave={() => onMouseLeave && onMouseLeave()}
    >
      <div className="flex items-center gap-3">
        <img src={member.picture || ''} alt={member.name} className="w-12 h-12 rounded-full object-cover bg-neutral-100" />
        <div>
          <div className="font-medium text-neutral-900">{member.name}</div>
          <div className="text-xs text-neutral-500">{member.role || 'Member'} {member.isOwner ? '• Owner' : ''}</div>
          {member.email && <div className="text-xs text-neutral-500 truncate">{member.email}</div>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3">
        <button className="text-sm text-neutral-500" onClick={onRequestClose}>Close</button>
        <button
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => {
            console.log('MemberProfilePopover: View profile clicked for id=', member.id);
            // Pass the member object in navigation state as a fallback if backend lookup fails
            navigate(`/profile/${member.id}`, { state: { member } });
            onRequestClose();
          }}
        >
          View profile
        </button>
      </div>
    </div>
  );
};

export default MemberProfilePopover;
