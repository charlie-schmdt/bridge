import { useNavigate } from "react-router-dom";
import { MdClass } from "react-icons/md"; // Example: using react-icons

export default function WorkspaceCard({ title, description, nextMeeting, members }) {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/workspace");
  };

  return (
    <div className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow p-4 flex flex-col justify-between">
      
      {/* Title with icon */}
      <div className="flex items-center gap-2 mb-2">
        <MdClass className="text-blue-600" size={28} />  {/* Icon */}
      </div>

      <h3 className="font-semibold text-lg">{title}</h3>
      {/* Description */}
      <p className="text-sm text-gray-500 mb-4">{description}</p>

      {/* Button */}
      <button
        onClick={handleEnter}
        className="mt-auto w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
      >
        Enter Workspace
      </button>

      {/* Footer info */}
      <div className="mt-2 text-xs text-gray-400">
        <p>Next Meeting: {nextMeeting}</p>
        <p>{members} members</p>
      </div>
    </div>
  );
}
