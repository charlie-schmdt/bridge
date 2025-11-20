import { Button, Card } from "@heroui/react";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Banner from "../../components/Banner";
import CreateWorkspaceCard from "./CreateWorskpaceCard";
import Header from "../../components/Header";
import WorkspaceCard from "./WorkspaceCard";
import { Endpoints } from "../../utils/endpoints";

import { useAuth } from "../../contexts/AuthContext";

interface Workspace {
  id: number;
  name: string | null;
  description: string | null;
  isPrivate: boolean;
  authorizedUsers: string[];
  ownerId: string;
  createdAt: string;
  isFavorite: boolean;
}

export const homeLoader = async () => {
  return { message: "Home Page" };
};

export const HomeLayout = () => {
  const { user } = useAuth(); // Get current user

  // State for both user workspaces and public workspaces
  const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
  const [publicWorkspaces, setPublicWorkspaces] = useState<Workspace[]>([]);
  const [joinableWorkspaces, setJoinableWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [userWorkspacesLoading, setUserWorkspacesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const handleFavoriteToggle = (workspaceId: string, isFavorite: boolean) => {
    setUserWorkspaces((prevWorkspaces) => {
      const updated = prevWorkspaces.map(
        (ws) => (ws.id.toString() === workspaceId ? { ...ws, isFavorite } : ws) // ← FIX
      );

      // Re-sort: favorites first
      return updated.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
    });

    setPublicWorkspaces((prevWorkspaces) => {
      return prevWorkspaces.map(
        (ws) => (ws.id.toString() === workspaceId ? { ...ws, isFavorite } : ws) // ← FIX
      );
    });
  };

  // Fetch user's workspaces (where they're a member)
  useEffect(() => {
    const fetchUserWorkspaces = async () => {
      if (!user) {
        setUserWorkspaces([]);
        setUserWorkspacesLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(Endpoints.WORKSPACES_USER, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user workspaces");
        }

        const data = await response.json();
        console.log(data);
        setUserWorkspaces(data);
        console.log("✅ Fetched user workspaces:", data.length);
      } catch (err) {
        console.error("❌ Error fetching user workspaces:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user workspaces"
        );
      } finally {
        setUserWorkspacesLoading(false);
      }
    };

    fetchUserWorkspaces();

    // Fetch joinable (invited) workspaces for this user
    const fetchJoinable = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(Endpoints.WORKSPACES_JOINABLE, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok)
          throw new Error("Failed to fetch joinable workspaces");
        const data = await response.json();
        setJoinableWorkspaces(data.workspaces || []);
      } catch (err) {
        console.error("Error fetching joinable workspaces:", err);
      }
    };

    fetchJoinable();
  }, [user]); // Re-fetch when user changes (login/logout)

  // Fetch public workspaces (for discovery)
  useEffect(() => {
    const fetchPublicWorkspaces = async () => {
      try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(Endpoints.WORKSPACES_PUBLIC, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch public workspaces");
        }

        const data = await response.json();
        setPublicWorkspaces(data);
        console.log("✅ Fetched public workspaces:", data.length);
      } catch (err) {
        console.error("❌ Error fetching public workspaces:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch public workspaces"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicWorkspaces();
  }, []);

  // Refresh both workspace lists (called after joining a workspace)
  const refreshWorkspaces = async () => {
    console.log("🔄 Refreshing workspace lists...");

    // Refresh user workspaces
    if (user) {
      setUserWorkspacesLoading(true);
      try {
        const token = localStorage.getItem("bridge_token");
        const response = await fetch(Endpoints.WORKSPACES_USER, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserWorkspaces(data);
        }
      } catch (err) {
        console.error("Error refreshing user workspaces:", err);
      } finally {
        setUserWorkspacesLoading(false);
      }
    }

    // Refresh public workspaces
    try {
      const response = await fetch(Endpoints.WORKSPACES_PUBLIC);
      if (response.ok) {
        const data = await response.json();
        setPublicWorkspaces(data);
      }
    } catch (err) {
      console.error("Error refreshing public workspaces:", err);
    }

    // Refresh joinable workspaces
    if (user) {
      try {
        const token = localStorage.getItem("bridge_token");
        const res = await fetch(Endpoints.WORKSPACES_JOINABLE, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const json = await res.json();
          setJoinableWorkspaces(json.workspaces || []);
        }
      } catch (err) {
        console.error("Error refreshing joinable workspaces:", err);
      }
    }
  };

  // Filter functions
  const filterOwnWorkspace = (workspace: Workspace) => {
    if (activeFilter === "Private") return workspace.isPrivate;
    if (activeFilter === "Public") return !workspace.isPrivate;
    return true; // 'All' selected
  };

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filterWorkspace = (workspace: Workspace) =>
    workspace.name?.toLowerCase().includes(normalizedSearchTerm) ||
    workspace.description?.toLowerCase().includes(normalizedSearchTerm);

  // Filter user's workspaces (replaces PERSONAL_WORKSPACES)
  const filteredUserWorkspaces = useMemo(
    () => userWorkspaces.filter(filterWorkspace),
    [userWorkspaces, normalizedSearchTerm]
  );

  const userWorkspacesFilteredByView = useMemo(() => {
    return filteredUserWorkspaces.filter(filterOwnWorkspace);
  }, [filteredUserWorkspaces, activeFilter]);

  // Filter public workspaces (exclude ones user already joined)
  const filteredPublicWorkspaces = useMemo(() => {
    const userWorkspaceIds = userWorkspaces.map((ws) => ws.id);

    return publicWorkspaces.filter((workspace) => {
      // Exclude workspaces user already joined
      const notAlreadyJoined = !userWorkspaceIds.includes(workspace.id);
      // Apply search filter
      const matchesSearch = filterWorkspace(workspace);

      return notAlreadyJoined && matchesSearch;
    });
  }, [publicWorkspaces, userWorkspaces, normalizedSearchTerm]);

  return (
    <Card>
      <div className="App flex flex-col gap-8">
        <div className="gap-0">
          <Header />
          <Banner />
        </div>

        {/* Central Search Bar */}
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

        {/* User's Workspaces Section */}
        <section className="px-6">
          <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your Workspaces
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                {user
                  ? `Workspaces you're a member of (${userWorkspaces.length})`
                  : "Login to see your workspaces"}
              </p>
            </div>

            {/* Filter buttons - only show if user has workspaces */}
            {user && userWorkspaces.length > 0 && (
              <div className="mt-6 flex w-fit bg-gray-100 p-1.5 rounded-xl shadow-inner">
                <Button
                  onClick={() => setActiveFilter("All")}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeFilter === "All"
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-gray-500 hover:bg-white/50"
                  }`}
                >
                  All
                </Button>
                <Button
                  onClick={() => setActiveFilter("Private")}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeFilter === "Private"
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-gray-500 hover:bg-white/50"
                  }`}
                >
                  Private
                </Button>
                <Button
                  onClick={() => setActiveFilter("Public")}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeFilter === "Public"
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-gray-500 hover:bg-white/50"
                  }`}
                >
                  Public
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {!user ? (
              <p className="col-span-full text-gray-500 text-center py-8">
                Please log in to view your workspaces.
              </p>
            ) : userWorkspacesLoading ? (
              <div className="col-span-full text-center py-8 text-gray-600">
                Loading your workspaces...
              </div>
            ) : userWorkspacesFilteredByView.length > 0 ? (
              userWorkspacesFilteredByView.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  id={workspace.id}
                  title={workspace.name}
                  description={workspace.description}
                  members={workspace.authorizedUsers?.length || 0}
                  authorizedUsers={workspace.authorizedUsers}
                  isPrivate={workspace.isPrivate}
                  isFavorite={workspace.isFavorite}
                  onFavoriteToggle={handleFavoriteToggle}
                  nextMeeting="Tomorrow at 2 PM"
                  onJoinSuccess={refreshWorkspaces}
                />
              ))
            ) : (
              <p className="col-span-full text-gray-500 text-center py-8">
                {searchTerm
                  ? "No workspaces match your search."
                  : "You haven't joined any workspaces yet. Discover some below!"}
              </p>
            )}

            {/* Always show Create Card if user is logged in */}
            {user && <CreateWorkspaceCard />}
          </div>
        </section>

        {/* Joinable Workspaces Section */}
        {user && joinableWorkspaces.length > 0 && (
          <section className="px-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Invited Workspaces
              </h2>
              <p className="mt-2 text-gray-600">
                Workspaces you've been invited to — accept to join them.
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
              {joinableWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="bg-white rounded-xl shadow p-4 border border-gray-100"
                >
                  <h3 className="font-semibold text-lg">{ws.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{ws.description}</p>
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      onPress={async () => {
                        try {
                          const token = localStorage.getItem("bridge_token");
                          const resp = await fetch(
                            `${Endpoints.WORKSPACE}/${ws.id}/accept-invite`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );
                          const data = await resp.json();
                          if (resp.ok && data.success) {
                            // Refresh lists
                            refreshWorkspaces();
                            // Remove from local joinable list
                            setJoinableWorkspaces((prev) =>
                              prev.filter((j) => j.id !== ws.id)
                            );
                          } else {
                            alert(data.message || "Failed to accept invite");
                          }
                        } catch (err) {
                          console.error("Accept invite error:", err);
                          alert("Failed to accept invite");
                        }
                      }}
                    >
                      Accept Invite
                    </Button>
                    <Button
                      onPress={() =>
                        setJoinableWorkspaces((prev) =>
                          prev.filter((j) => j.id !== ws.id)
                        )
                      }
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="col-span-full w-full px-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Discover Workspaces
            </h2>
            <p className="mt-2 text-gray-600 text-lg">
              Find and join new workspaces ({filteredPublicWorkspaces.length}{" "}
              available)
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loading ? (
              <div className="col-span-full text-center py-8 text-gray-600">
                Loading available workspaces...
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-8 text-red-600">
                {error}
              </div>
            ) : filteredPublicWorkspaces.length > 0 ? (
              filteredPublicWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  id={workspace.id}
                  title={workspace.name}
                  description={workspace.description}
                  members={workspace.authorizedUsers?.length || 0}
                  authorizedUsers={workspace.authorizedUsers}
                  isPrivate={workspace.isPrivate}
                  nextMeeting="Tomorrow at 2 PM"
                  onJoinSuccess={refreshWorkspaces}
                  isFavorite={workspace.isFavorite}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchTerm
                  ? "No public workspaces match your search criteria."
                  : "No public workspaces available to join."}
              </div>
            )}
          </div>
        </section>
      </div>
    </Card>
  );
};
