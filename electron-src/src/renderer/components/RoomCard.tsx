const statusColors = {
  active: "text-green-600",
  scheduled: "text-yellow-600",
  offline: "text-red-600",
};

export interface RoomCardProps {
  title: string;
  description: string;
  status: "active" | "scheduled" | "offline";
  nextMeeting: string;
}

export function RoomCard({ title, description, status, nextMeeting }: RoomCardProps) {
  return (
    <div className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow p-4 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
        <span className={`text-sm font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      <p className="text-sm text-gray-500">{description}</p>

      {status === "active" && (
        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg">
          Join Room
        </button>
      )}
      {status === "scheduled" && (
        <button className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg">
          View Schedule
        </button>
      )}
      {status === "offline" && (
        <button className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg">
          Start Meeting
        </button>
      )}

      <p className="text-xs text-gray-400 mt-2">Next Meeting: {nextMeeting}</p>
    </div>
  );
}
