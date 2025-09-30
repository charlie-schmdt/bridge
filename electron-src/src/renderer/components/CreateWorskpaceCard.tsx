export default function CreateWorkspaceCard() {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl shadow p-4 
        w-full min-w-0 flex flex-col justify-between">
      <span className="text-3xl">➕</span>
      <p className="font-medium mt-2">Create New Workspace</p>
      <button className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition cursor-pointer">
        Get Started
      </button>
    </div>
  );
}
