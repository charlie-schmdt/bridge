import { useState } from "react";

export const useNotification = () => {
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const showNotification = (message: string, type: string = "info", duration: number = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  return { notification, showNotification };
};


/*
ADD THIS TO YOUR COMPONENT WHERE YOU WANT TO USE NOTIFICATIONS:
 import { useNotification } from "@/hooks/useNotification"; // at the top of file
 const { notification, showNotification } = useNotification(); // inside the exported component function

 // To trigger from a function:
 showNotification("Your message here", "success"); // type can be "success", "error", "warning", "info", "created"

// To render the notification banner (place this in the JSX return block):
{notification && (
    <div className="fixed top-20 right-4 z-[9999]">
    <NotificationBanner
        message={notification.message}
        type={notification.type as "success" | "error" | "warning" | "info" | "created"}
    />
    </div>
)}
 */