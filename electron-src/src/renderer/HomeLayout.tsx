import { Card, CardBody } from "@heroui/react";
import { useLoaderData } from "react-router-dom";
import Header from "./components/Header";
import WorkspaceCard from "./components/WorkspaceCard";
import NotificationBanner from "./components/NotificationBanner";
import CreateWorkspaceCard from "./components/CreateWorskpaceCard";
import Banner from "./components/Banner";
import { VideoFeedProvider } from "./providers/VideoFeedProvider";
import { useContext } from "react";
import { VideoFeedContext } from "./contexts/VideoFeedContext";

// REMOVE the AuthContext import for now - let's test basic console first
// import { useAuth } from './contexts/AuthContext';


export const homeLoader = async () => {
  return { message: "Home Page" };
}

export const HomeLayout = () => {
  console.log('🟢 BASIC TEST: HomeLayout component rendering');


  return (
    <Card>
      {/* Header */}
      {/* ensure vertical stacking */}
      <div className="App flex flex-col gap-8">
      <Header />
      <Banner />

        {/* Personal Workspaces */}
        <section>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Your Workspaces</h1>
            <p className="mt-2 text-gray-600 text-lg">Manage and access all your meeting spaces.</p>
          </div>

            {/* Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
              <CreateWorkspaceCard />
            </div>
          </section>

          {/* Joinable Workspaces (below) */}
        <section className="col-span-full w-full"> {/* guarantees full width even if a parent is grid */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Joinable Workspaces</h2>
            <p className="mt-2 text-gray-600 text-lg">
              Discover and join workspaces that are open for collaboration.
            </p>
          </div>
          {/* Cards go here! */}
        </section>
    </div>
    </Card >
  );
}