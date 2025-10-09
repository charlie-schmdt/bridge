import { AlertTriangle, CheckCircle, Info, PlusCircle } from "lucide-react";

interface NotificationBannerProps {
  message: string;
  type?: "success" | "error" | "warning" | "info" | "created";
}

export default function NotificationBanner({
  message,
  type = "info",
}: NotificationBannerProps) {
  const styles = {
    success: "bg-green-100 border-green-300 text-green-800",
    error: "bg-red-100 border-red-300 text-red-800",
    warning: "bg-yellow-100 border-yellow-300 text-yellow-800",
    info: "bg-blue-100 border-blue-300 text-blue-800",
    created: "bg-blue-100 border-blue-300 text-blue-800",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    created: <PlusCircle className="w-5 h-5" />,
  };

  return (
    <div
      className={`border px-4 py-2 rounded-md flex items-center gap-3 shadow-sm ${styles[type]}`}
    >
      {icons[type]}
      <p className="font-medium">{message}</p>
    </div>
  );
}
