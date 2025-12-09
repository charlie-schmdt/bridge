import React from "react";
import { useNavigate } from "react-router-dom";

const WorkspaceList: React.FC<{
  workspaces: any[];
  enabledIds: string[];
  onToggle: (id: string) => void;
}> = ({ workspaces, enabledIds, onToggle }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      {workspaces.map((w) => (
        <div key={w.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/workspace/${w.id}`)}>
            <span style={{ background: w.color }} className="w-3 h-3 rounded-full inline-block" />
            <div>
              <div className="text-sm font-medium text-gray-800">{w.name}</div>
            </div>
          </div>
          <button onClick={() => onToggle(String(w.id))} className={`p-1 rounded-full ${enabledIds.includes(String(w.id)) ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {enabledIds.includes(String(w.id)) ? '✓' : ''}
          </button>
        </div>
      ))}
    </div>
  );
};

export default WorkspaceList;
