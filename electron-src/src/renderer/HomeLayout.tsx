import { Button, Card } from "@heroui/react";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Banner from "./components/Banner";
import CreateWorkspaceCard from "./components/CreateWorskpaceCard";
import Header from "./components/Header";
import WorkspaceCard from "./components/WorkspaceCard";
import { Endpoints } from "./utils/endpoints";
import NotificationBanner from "./components/NotificationBanner";

import { useAuth } from "./contexts/AuthContext";

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
}

export const HomeLayout = () => {
  const { user } = useAuth(); // Get current user
  
  // State for both user workspaces and public workspaces
  const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
  const [publicWorkspaces, setPublicWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [userWorkspacesLoading, setUserWorkspacesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState("All");

const handleFavoriteToggle = (workspaceId: string, isFavorite: boolean) => {
  setUserWorkspaces(prevWorkspaces => {
    const updated = prevWorkspaces.map(ws => 
      ws.id.toString() === workspaceId ? { ...ws, isFavorite } : ws // ← FIX
    );
    
    // Re-sort: favorites first
    return updated.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  });

  setPublicWorkspaces(prevWorkspaces => {
    return prevWorkspaces.map(ws => 
      ws.id.toString() === workspaceId ? { ...ws, isFavorite } : ws // ← FIX
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
        const token = localStorage.getItem('bridge_token');
        const response = await fetch(Endpoints.WORKSPACES_USER, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user workspaces');
        }
        
        const data = await response.json();
        console.log(data);
        setUserWorkspaces(data);
        console.log('✅ Fetched user workspaces:', data.length);
      } catch (err) {
        console.error('❌ Error fetching user workspaces:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user workspaces');
      } finally {
        setUserWorkspacesLoading(false);
      }
    };

    fetchUserWorkspaces();
  }, [user]); // Re-fetch when user changes (login/logout)

  // Fetch public workspaces (for discovery)
  useEffect(() => {
    const fetchPublicWorkspaces = async () => {
      try {
        const token = localStorage.getItem('bridge_token');
        const response = await fetch(Endpoints.WORKSPACES_PUBLIC, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch public workspaces');
        }

        const data = await response.json();
        setPublicWorkspaces(data);
        console.log('✅ Fetched public workspaces:', data.length);
      } catch (err) {
        console.error('❌ Error fetching public workspaces:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch public workspaces');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicWorkspaces();
  }, []);

  // Refresh both workspace lists (called after joining a workspace)
  const refreshWorkspaces = async () => {
    console.log('🔄 Refreshing workspace lists...');
    
    // Refresh user workspaces
    if (user) {
      setUserWorkspacesLoading(true);
      try {
        const token = localStorage.getItem('bridge_token');
        const response = await fetch(Endpoints.WORKSPACES_USER, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserWorkspaces(data);
        }
      } catch (err) {
        console.error('Error refreshing user workspaces:', err);
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
      console.error('Error refreshing public workspaces:', err);
    }
  };

  const [notification, setNotification] = useState<{ message: string; type: any } | null>(null);

  const showNotification = (message: string, type: any = "info", duration: number = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const requestJoinWorkspace = async (workspaceId: number) => {
    if (!user) {
      showNotification('Login required to request access', 'info');
      return;
    }

    try {
      const token = localStorage.getItem('bridge_token');
      const resp = await fetch(`${Endpoints.WORKSPACE}/${workspaceId}/request-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'Requesting access via Discover' })
      });

      if (resp.ok) {
        showNotification('Request to join submitted', 'created');
      } else {
        // Backend may not yet implement; show queued/info
        showNotification('Request queued (backend not implemented)', 'info');
      }
    } catch (err) {
      console.error('Request to join failed:', err);
      showNotification('Failed to send request to join', 'error');
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
    const userWorkspaceIds = userWorkspaces.map(ws => ws.id);
    
    return publicWorkspaces.filter(workspace => {
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
        {notification && (
          <div className="fixed top-20 right-4 z-[9999]">
            <NotificationBanner
              message={notification.message}
              type={notification.type}
            />
          </div>
        )}

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
                  : "Login to see your workspaces"
                }
              </p>
            </div>

            {/* Filter buttons - only show if user has workspaces */}
            {user && userWorkspaces.length > 0 && (
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
                  : "You haven't joined any workspaces yet. Discover some below!"
                }
              </p>
            )}

            {/* Always show Create Card if user is logged in */}
            {user && <CreateWorkspaceCard />}
          </div>
        </section>

        {/* Joinable Workspaces Section */}
        <section className="col-span-full w-full px-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Discover Workspaces
            </h2>
            <p className="mt-2 text-gray-600 text-lg">
              Find and join new workspaces ({filteredPublicWorkspaces.length} available)
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
              filteredPublicWorkspaces.map((workspace) => {
                const isMember = user ? (workspace.authorizedUsers || []).includes(user.id) : false;

                // If the workspace is private and the current user is NOT a member,
                // render a simplified orange card that allows the user to request access.
                if (workspace.isPrivate && !isMember) {
                  return (
                    <div key={workspace.id} className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 p-4 flex flex-col justify-between border border-orange-100">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-orange-600 bg-orange-50 rounded-full p-2">
                              🔒
                            </div>
                            <span className="text-lg font-semibold text-gray-900">{workspace.name}</span>
                            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Private</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 flex-grow">{workspace.description}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-orange-50 flex flex-col gap-3 items-stretch">
                        <div className="flex justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>{workspace.authorizedUsers?.length || 0} members</span>
                          </div>
                        </div>

                        <button
                          onClick={() => requestJoinWorkspace(workspace.id)}
                          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-150 font-medium"
                        >
                          Request to Join
                        </button>
                      </div>
                    </div>
                  );
                }

                // Otherwise show the normal WorkspaceCard (public or member-visible)
                return (
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
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchTerm 
                  ? "No public workspaces match your search criteria." 
                  : "No public workspaces available to join."
                }
              </div>
            )}
          </div>
        </section>
      </div>
    </Card>
  );
}