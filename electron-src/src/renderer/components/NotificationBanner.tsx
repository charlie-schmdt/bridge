export default function NotificationBanner({ message }) {
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md flex items-center gap-2 mt-4">
      <span>⚠️</span>
      <p>{message}</p>
    </div>
  );
}
