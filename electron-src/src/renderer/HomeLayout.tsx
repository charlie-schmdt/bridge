import { Card, CardBody } from "@heroui/react";
import { useLoaderData } from "react-router-dom";
import Header from "./components/Header";
import WorkspaceCard from "./components/WorkspaceCard";
import NotificationBanner from "./components/NotificationBanner";
import CreateWorkspaceCard from "./components/CreateWorskpaceCard";
import Banner from "./components/Banner";
import { VideoFeedProvider } from "./providers/VideoFeedProvider";
import { useContext, useEffect, useState } from "react";
import { VideoFeedContext } from "./contexts/VideoFeedContext";

interface Workspace {
  id: number;          // Changed from string to number since workspace_id is BIGINT
  name: string | null; // Made nullable to match database
  description: string | null;
  isPrivate: boolean;
  authorizedUsers: string[];
  ownerId: string;     // UUID from owner_real_id
  createdAt: string;   // created_at timestamp
}

export const homeLoader = async () => {
  return { message: "Home Page" };
}

export const HomeLayout = () => {
  const [publicWorkspaces, setPublicWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicWorkspaces = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/workspaces/public', {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch public workspaces');
        }

        const data = await response.json();
        setPublicWorkspaces(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch public workspaces');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicWorkspaces();
  }, []);


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
        <section className="col-span-full w-full">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Joinable Workspaces</h2>
            <p className="mt-2 text-gray-600 text-lg">
              Discover and join workspaces that are open for collaboration.
            </p>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loading ? (
              <div className="col-span-full text-center">Loading public workspaces...</div>
            ) : error ? (
              <div className="col-span-full text-center text-red-600">{error}</div>
            ) : (
              publicWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  title={workspace.name}
                  description={workspace.description}
                  members={workspace.authorizedUsers.length}
                />
              ))
            )}
          </div>
        </section>
    </div>
    </Card >
  );
}