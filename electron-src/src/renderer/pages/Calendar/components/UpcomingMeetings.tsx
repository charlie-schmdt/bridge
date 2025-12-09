import React from "react";
import { useNavigate } from "react-router-dom";

const UpcomingMeetings: React.FC<{ meetings: any[]; workspaces: any[] }> = ({ meetings, workspaces }) => {
  const getWorkspace = (id: string | number) => workspaces.find((w) => String(w.id) === String(id)) || { name: "Unknown", color: "#999" };

  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      {meetings.map((m) => {
        const ws = getWorkspace(m.workspaceId);
        return (
          <div key={m.id} className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/workspace/${ws.id}`)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-blue-600">Today <span className="text-gray-500 text-xs">{m.recurring ? m.recurring : ''}</span></div>
                <div className="text-lg font-semibold text-gray-800">{m.title}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2"><span style={{background: ws.color}} className="w-3 h-3 rounded-full inline-block" />{ws.name}</div>
                <div className="text-xs text-gray-500 mt-2">{new Date(m.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(m.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {m.attendees} people</div>
              </div>
              <div className="text-gray-400">→</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingMeetings;
