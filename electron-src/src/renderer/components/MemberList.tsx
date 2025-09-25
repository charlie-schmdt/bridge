const statusColors = {
  online: "text-green-600",
  offline: "text-red-600",
  away: "text-yellow-600",
};

export default function MembersList({ members }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 w-64">
      <h3 className="font-semibold mb-4">Members ({members.length})</h3>
      <ul className="space-y-3">
        {members.map((m, i) => (
          <li key={i} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-gray-500">{m.email}</p>
            </div>
            <span className={statusColors[m.status]}>●</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
