import { Card, CardBody } from "@heroui/react";
import { useLoaderData } from "react-router-dom";
import Header from "./components/Header";
import WorkspaceCard from "./components/WorkspaceCard";
import NotificationBanner from "./components/NotificationBanner";
import CreateWorkspaceCard from "./components/CreateWorskpaceCard";
import Banner from "./components/Banner";

export const homeLoader = async () => {
  return { message: "Home Page" };
}

export const HomeLayout = () => {
  // Define roomCardProps with default or mock values
  const workspaceCardProps = {
    title: "Test Workspace",
    description: "This is a test workspace",
    nextMeeting: "Tomorrow at 10 AM",
    members: [],
    onEnter: () => console.log("Entering workspace"),
  };
  const roomCardProps = {
    title: "Test Room",
    description: "This is a test room",
    status: "active", // can be 'active', 'scheduled', or 'offline'   ;
    nextMeeting: "Tomorrow at 10 AM",
  };
  return (
    <Card>
      <div className='App'>
        {/* Header */}
        <Header />
        <Banner />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Workspaces</h1>
        <p className="mt-2 text-gray-600 text-lg">Manage and access all your meeting spaces.</p>
      </div>

        {/* Grid container */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* Workspace cards */}
        <WorkspaceCard
          title="Marketing"
          description="Marketing team workspace"
          nextMeeting="Tomorrow 10 AM"
          members={12}
        />
        <WorkspaceCard
          title="Design"
          description="Design team workspace"
          nextMeeting="Today 2 PM"
          members={8}
        />
        {/* Create workspace card */}
        <CreateWorkspaceCard />
        {/* Add more cards here */}
      </div>

      </div>
    </Card>
  );
}
