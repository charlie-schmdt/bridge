import { Card } from "@heroui/react";
import Header from "./components/Header";
import MembersList from "./components/MemberList";
import RoomCard from "./components/RoomCard";
import NotificationBanner from "./components/NotificationBanner";

export const WorkspaceLayout = () => {
  const roomCardProps = {
    title: "Test Room",
    description: "This is a test room",
    status: "active", // can be 'active', 'scheduled', or 'offline'
    nextMeeting: "Tomorrow at 10 AM",
  };

  return (
    <Card className="min-h-screen bg-gray-50">
      <div className="workspace-app">
        {/* Header */}
        <Header />

        {/* Page title */}
        <div className="mt-6 px-6">
          <h1 className="text-3xl font-bold text-gray-900">This Workspace</h1>
          <p className="mt-2 text-gray-600 text-lg">
            Manage your team members, calls, and workspace access.
          </p>
        </div>

        {/* Notification Banner */}
        <div className="mt-6 px-6">
          <NotificationBanner message="This is a notification banner!" />
        </div>

        {/* Main content: Room cards + Members list */}
        <div className="mt-6 px-6 flex flex-col lg:flex-row gap-6">
          {/* Left: Room cards (75%) */}
          <div className="lg:w-3/4 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <RoomCard {...roomCardProps} />
            <RoomCard {...roomCardProps} />
            <RoomCard {...roomCardProps} />
          </div>

          {/* Right: Members list (25%) */}
          <div className="lg:w-1/4 w-full">
            <MembersList members={[]} />
          </div>
        </div>
      </div>
    </Card>
  );
};
