import { Card, CardBody } from "@heroui/react";
import { useLoaderData } from "react-router-dom";
import Header from "./components/Header";
import WorkspaceCard from "./components/WorkspaceCard";
import NotificationBanner from "./components/NotificationBanner";
import CreateWorkspaceCard from "./components/CreateWorskpaceCard";
import Banner from "./components/Banner";
import { VideoFeedProvider } from "./providers/VideoFeedProvider";
import { useContext, useEffect, useState, useMemo } from "react";
import { VideoFeedContext } from "./contexts/VideoFeedContext";
import { Search, Users, Calendar, Plus } from "lucide-react"; // Added lucide icons for component mockups
import { Button } from "@heroui/react";
import { Endpoints } from "../utils/endpoints"


interface Workspace {
  id: number;          // Changed from string to number since workspace_id is BIGINT
  name: string | null; // Made nullable to match database
  description: string | null;
  isPrivate: boolean;
  authorizedUsers: string[];
  ownerId: string;     // UUID from owner_real_id
  createdAt: string;   // created_at timestamp
}

const PERSONAL_WORKSPACES: Workspace[] = [
    {
        id: 998, name: "Marketing Strategy", description: "All plans, creatives, and performance reports for the quarter.", isPrivate: true, authorizedUsers: new Array(12).fill(''), ownerId: 'user-a', createdAt: new Date().toISOString()
    },
    {
        id: 999, name: "Product Design Review", description: "Weekly sync for UI/UX critiques and feature mockups.", isPrivate: true, authorizedUsers: new Array(8).fill(''), ownerId: 'user-a', createdAt: new Date().toISOString()
    },
    {
        id: 997, name: "Team HR Hub", description: "Documents related to hiring, onboarding, and company policies.", isPrivate: true, authorizedUsers: new Array(5).fill(''), ownerId: 'user-a', createdAt: new Date().toISOString()
    },
];

export const homeLoader = async () => {
  return { message: "Home Page" };
}

export const HomeLayout = () => {
  const [publicWorkspaces, setPublicWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    const fetchPublicWorkspaces = async () => {
      try {
        const response = await fetch(Endpoints.WORKSPACES_PUBLIC, {
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

      const [activeFilter, setActiveFilter] = useState("All"); // 'All', 'Private', or 'Public'

      const filterOwnWorkspace = (workspace: Workspace) => {
        if (activeFilter === "Private") return workspace.isPrivate;
        if (activeFilter === "Public") return !workspace.isPrivate;
        return true; // 'All' selected
      };

      // 3. FILTERING LOGIC (Applied to both sets of data)
      const normalizedSearchTerm = searchTerm.toLowerCase();

      const filterWorkspace = (workspace: Workspace) =>
        workspace.name?.toLowerCase().includes(normalizedSearchTerm) ||
        workspace.description?.toLowerCase().includes(normalizedSearchTerm);

      const filteredPersonalWorkspaces = useMemo(
        () => PERSONAL_WORKSPACES.filter(filterWorkspace),
        [normalizedSearchTerm]
      );
      const personalWorkspacesFilteredByView = useMemo(() => {
        // Apply your privacy logic to the search-filtered list
        return filteredPersonalWorkspaces.filter(filterOwnWorkspace);
      }, [filteredPersonalWorkspaces, activeFilter]); // Dependency on the search results and the active filter

      const filteredPublicWorkspaces = useMemo(
        () => publicWorkspaces.filter(filterWorkspace),
        [publicWorkspaces, normalizedSearchTerm]
      );

  return (
    <Card>
      {/* Header */}
      {/* ensure vertical stacking */}
      <div className="App flex flex-col gap-8">
        <div className="gap-0">
          <Header />
          <Banner />
        </div>

        {/* 4. CENTRAL SEARCH BAR (Placed above all workspace sections) */}
        <div className="w-full max-w-6xl mx-auto px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search all workspaces by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-10 pr-4 text-gray-800 bg-white border border-gray-300 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition duration-150"
            />
          </div>
        </div>
        {/* Personal Workspaces (Now uses filteredPersonalWorkspaces) */}
        <section className="px-6">
          <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your Workspaces
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                Manage and access all your meeting spaces.
              </p>
            </div>
            {/* --- Styled Button Group --- */}
            <div className="mt-6 flex w-fit bg-gray-100 p-1.5 rounded-xl shadow-inner">
              <Button
                onClick={() => setActiveFilter('All')}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeFilter === 'All'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                All
              </Button>
              <Button
                onClick={() => setActiveFilter('Private')}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeFilter === 'Private'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                Private
              </Button>
              <Button
                onClick={() => setActiveFilter('Public')}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeFilter === 'Public'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                Public
              </Button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {personalWorkspacesFilteredByView.length > 0 ? (
              personalWorkspacesFilteredByView.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  title={workspace.name}
                  description={workspace.description}
                  members={workspace.authorizedUsers.length}
                />
              ))
            ) : (
              <p className="col-span-full text-gray-500">
                No personal workspaces match your search.
              </p>
            )}

            {/* Always show Create Card */}
            <CreateWorkspaceCard />
          </div>
        </section>

        {/* Joinable Workspaces (Now uses filteredPublicWorkspaces) */}
        <section className="col-span-full w-full px-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Joinable Workspaces
            </h2>
            <p className="mt-2 text-gray-600 text-lg">
              Discover and join workspaces that are open for collaboration.
            </p>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loading ? (
              <div className="col-span-full text-center py-4 text-gray-600">
                Loading public workspaces...
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-4 text-red-600">
                {error}
              </div>
            ) : filteredPublicWorkspaces.length > 0 ? (
              filteredPublicWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  title={workspace.name}
                  description={workspace.description}
                  members={workspace.authorizedUsers.length}
                />
              ))
            ) : (
              <div className="col-span-full text-gray-500 py-4">
                No joinable workspaces match your search criteria.
              </div>
            )}
          </div>
        </section>
      </div>
    </Card>
  );
}