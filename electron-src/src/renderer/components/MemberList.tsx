const statusColors = {
  online: "text-green-600",
  offline: "text-red-600",
  away: "text-yellow-600",
};

export default function MembersList({ members }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 w-64">
      <h3 className="font-semibold mb-4">Members ({members.length})</h3>
      <ul className="space-y-2">
        {members.map((member, i) => (
          <li key={member.id || i} className="text-gray-800">
            {member.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
