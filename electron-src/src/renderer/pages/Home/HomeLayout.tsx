import { Button, Card } from "@heroui/react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Banner from "../../components/Banner";
import CreateWorkspaceCard from "./CreateWorskpaceCard";
import Header from "../../components/Header";
import WorkspaceCard from "./WorkspaceCard";
import NotificationBanner from "../../components/NotificationBanner";

import { Endpoints } from "@/utils/endpoints";

import { useAuth } from "../../contexts/AuthContext";

interface Workspace {
  id: number;
  name: string | null;
  description: string | null;
  isPrivate: boolean;
  authorizedUsers: string[];
  blockedUsers: string[];
  ownerId: string;
  createdAt: string;
  isFavorite: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const WORKSPACES_PER_PAGE = 8;

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
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  // Pagination state
  const [userWorkspacesPage, setUserWorkspacesPage] = useState(1);
  const [publicWorkspacesPage, setPublicWorkspacesPage] = useState(1);
  const [userWorkspacesPagination, setUserWorkspacesPagination] = useState<PaginationData | null>(null);
  const [publicWorkspacesPagination, setPublicWorkspacesPagination] = useState<PaginationData | null>(null);
  // track backend totals so we can recalc pagination when user workspace totals arrive
  const [publicBackendTotal, setPublicBackendTotal] = useState<number | null>(null);
  const [publicFetchedAll, setPublicFetchedAll] = useState(false);
  // Joinable (invitations) pagination state
  const [joinableAll, setJoinableAll] = useState<Workspace[]>([]); // full list fetched from backend
  const [joinableWorkspacesPage, setJoinableWorkspacesPage] = useState(1);
  const [joinableWorkspacesPagination, setJoinableWorkspacesPagination] = useState<PaginationData | null>(null);

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
        // Reserve one slot for CreateWorkspaceCard when user is present
        const userLimit = user ? Math.max(1, WORKSPACES_PER_PAGE - 1) : WORKSPACES_PER_PAGE;
        const response = await fetch(
          `${Endpoints.WORKSPACES_USER}?page=${userWorkspacesPage}&limit=${userLimit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user workspaces");
        }

        const data = await response.json();
        console.log(data);
        setUserWorkspaces(data.workspaces || []);
        setUserWorkspacesPagination(data.pagination || null);
        console.log("✅ Fetched user workspaces:", data.workspaces?.length);
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

    // (Joinable workspaces are fetched by the dedicated fetchJoinable function below)
  }, [user, userWorkspacesPage]); // Re-fetch when user changes or page changes

  // Fetch public workspaces (for discovery)
  useEffect(() => {
    const fetchPublicWorkspaces = async () => {
      try {
        const token = localStorage.getItem("bridge_token");
        const limit = WORKSPACES_PER_PAGE;
        const requiredItems = publicWorkspacesPage * limit; // need enough items to fill pages up to requested page
        let collected: Workspace[] = [];
        let backendTotal = 0;
        let currentPage = 1; // always accumulate from backend page 1 to avoid overlaps
        let fetchedAll = false;

        while (collected.length < requiredItems && !fetchedAll) {
          const response = await fetch(
            `${Endpoints.WORKSPACES_PUBLIC}?page=${currentPage}&limit=${limit}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch public workspaces");
          }

          const data = await response.json();
          const items: Workspace[] = data.workspaces || [];
          backendTotal = data.pagination?.totalCount || backendTotal;

          // Filter out workspaces the user already joined
          const filtered = items.filter((w) => !(user && (w.authorizedUsers || []).includes(user.id)));

          collected = collected.concat(filtered);

          const totalPages = data.pagination?.totalPages || 1;
          if (currentPage >= totalPages) fetchedAll = true;
          else currentPage++;
        }

        // Slice out the requested client page
        const start = (publicWorkspacesPage - 1) * limit;
        const pageItems = collected.slice(start, start + limit);
        setPublicWorkspaces(pageItems);
        // store backend totals so pagination can be recalculated when user info arrives
        setPublicBackendTotal(backendTotal);
        setPublicFetchedAll(fetchedAll);
        console.log("✅ Fetched public workspaces (filled):", pageItems.length);
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
  }, [publicWorkspacesPage]); // Re-fetch when page changes

  // Recompute public pagination when backend totals or user workspace totals change
  useEffect(() => {
    const limit = WORKSPACES_PER_PAGE;
    if (publicBackendTotal == null) return; // not ready yet

    const joinedCount = user ? (userWorkspacesPagination?.totalCount || 0) : 0;
    const availableTotal = Math.max(0, publicBackendTotal - joinedCount);

    // If we fetched all backend pages already, prefer the exact availableTotal
    const totalCount = publicFetchedAll ? availableTotal : Math.max(availableTotal, publicWorkspaces.length);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    setPublicWorkspacesPagination({ page: publicWorkspacesPage, limit, totalCount, totalPages });
  }, [publicBackendTotal, publicFetchedAll, userWorkspacesPagination, publicWorkspacesPage, publicWorkspaces, user]);

  // Refresh both workspace lists (called after joining a workspace)
  const refreshWorkspaces = async () => {
    console.log("🔄 Refreshing workspace lists...");

    // Refresh user workspaces
    if (user) {
      setUserWorkspacesLoading(true);
      try {
        const token = localStorage.getItem("bridge_token");
        // Use same pagination strategy when refreshing
        const userLimit = user ? Math.max(1, WORKSPACES_PER_PAGE - 1) : WORKSPACES_PER_PAGE;
        const response = await fetch(`${Endpoints.WORKSPACES_USER}?page=${userWorkspacesPage}&limit=${userLimit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserWorkspaces(data.workspaces || []);
          setUserWorkspacesPagination(data.pagination || null);
        }
      } catch (err) {
        console.error("Error refreshing user workspaces:", err);
      } finally {
        setUserWorkspacesLoading(false);
      }
    }

    // Refresh public workspaces
    try {
      // Re-run the public fetch logic for current page - keep fill behavior
      const limit = WORKSPACES_PER_PAGE;
      let collected: Workspace[] = [];
      let backendTotal = 0;
      let currentPage = publicWorkspacesPage;
      let fetchedAll = false;
      const token = localStorage.getItem("bridge_token");

      while (collected.length < limit && !fetchedAll) {
        const response = await fetch(`${Endpoints.WORKSPACES_PUBLIC}?page=${currentPage}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!response.ok) break;
        const data = await response.json();
        const items: Workspace[] = data.workspaces || [];
        backendTotal = data.pagination?.totalCount || backendTotal;
        const filtered = items.filter((w) => !(user && (w.authorizedUsers || []).includes(user.id)));
        collected = collected.concat(filtered);
        const totalPages = data.pagination?.totalPages || 1;
        if (currentPage >= totalPages) fetchedAll = true;
        else currentPage++;
      }
      setPublicWorkspaces(collected.slice(0, limit));
      const joinedCount = user ? (userWorkspacesPagination?.totalCount || 0) : 0;
      const availableTotal = Math.max(0, backendTotal - joinedCount);
      const totalPages = Math.max(1, Math.ceil(availableTotal / limit));
      setPublicWorkspacesPagination({ page: publicWorkspacesPage, limit, totalCount: availableTotal, totalPages });
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
          // store full joinable set so frontend can filter+paginate
          setJoinableAll(json.workspaces || []);
          setJoinableWorkspacesPage(1);
        }
      } catch (err) {
        console.error("Error refreshing joinable workspaces:", err);
      }
    }
    // Also refresh joinable invites (handled by fetchJoinable below)
  };

  

  // Fetch joinable workspaces (invitations) for the current user
  const fetchJoinable = async () => {
    console.log('[HomeLayout] fetchJoinable called, user=', user?.id || null);
    if (!user) {
      console.log('[HomeLayout] fetchJoinable: no user, clearing joinableWorkspaces');
      setJoinableAll([]);
      setJoinableWorkspaces([]);
      return;
    }
    try {
      const token = localStorage.getItem('bridge_token');
      const resp = await fetch(Endpoints.WORKSPACES_JOINABLE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        console.log('[HomeLayout] Fetched joinable workspaces (all):', data.workspaces?.length || 0);
        // Store the full set — we'll filter then paginate on the frontend
        setJoinableAll(data.workspaces || []);
        // Reset page to 1 when data changes
        setJoinableWorkspacesPage(1);
      } else {
        const text = await resp.text().catch(() => '<no body>');
        console.warn('[HomeLayout] fetchJoinable non-OK response', resp.status, resp.statusText, text);
        setJoinableAll([]);
        setJoinableWorkspaces([]);
      }
    } catch (err) {
      console.error('[HomeLayout] Error fetching joinable workspaces:', err);
      setJoinableAll([]);
      setJoinableWorkspaces([]);
    }
  };

  // Ensure joinable invites are fetched on initial mount and when user changes
  useEffect(() => {
    fetchJoinable();
  }, [user]);

  // Apply filters (search + type) to the full joinable list BEFORE paginating
  const filteredJoinableWorkspaces = useMemo(() => {
    return joinableAll.filter((workspace) => {
      // apply type filter (Private/Public/All)
      if (activeFilter === "Private" && !workspace.isPrivate) return false;
      if (activeFilter === "Public" && workspace.isPrivate) return false;

      // apply search term
      const name = (workspace.name || "").toLowerCase();
      const desc = (workspace.description || "").toLowerCase();
      const search = normalizedSearchTerm;
      if (search && !name.includes(search) && !desc.includes(search)) return false;

      return true;
    });
  }, [joinableAll, activeFilter, normalizedSearchTerm]);

  // Reset joinable page when filters/search change
  useEffect(() => {
    setJoinableWorkspacesPage(1);
  }, [activeFilter, normalizedSearchTerm]);

  // Paginate the filtered joinable list and set the displayed page
  useEffect(() => {
    const limit = WORKSPACES_PER_PAGE;
    const totalCount = filteredJoinableWorkspaces.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    let page = joinableWorkspacesPage;
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    setJoinableWorkspacesPagination({ page, limit, totalCount, totalPages });
    const start = (page - 1) * limit;
    setJoinableWorkspaces(filteredJoinableWorkspaces.slice(start, start + limit));
  }, [filteredJoinableWorkspaces, joinableWorkspacesPage]);

  const acceptInvite = async (workspaceId: number) => {
    try {
      const token = localStorage.getItem('bridge_token');
      const resp = await fetch(`${Endpoints.WORKSPACE}/${workspaceId}/accept-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('[HomeLayout] acceptInvite response status:', resp.status);
      if (resp.ok) {
        showNotification('Invite accepted — joined workspace', 'success');
        // Refresh lists
        await refreshWorkspaces();
        await fetchJoinable();
        setJoinableWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      } else {
        const data = await resp.json().catch(() => ({}));
        showNotification(data.message || 'Failed to accept invite', 'error');
      }
    } catch (err) {
      console.error('Accept invite failed:', err);
      showNotification('Failed to accept invite', 'error');
    }
  };

  const rejectInvite = async (workspaceId: number) => {
    try {
      const token = localStorage.getItem('bridge_token');
      const resp = await fetch(`${Endpoints.WORKSPACE}/${workspaceId}/reject-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('[HomeLayout] rejectInvite response status:', resp.status);
      if (resp.ok) {
        showNotification('Invite rejected', 'info');
        await fetchJoinable();
        setJoinableWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      } else {
        const data = await resp.json().catch(() => ({}));
        showNotification(data.message || 'Failed to reject invite', 'error');
      }
    } catch (err) {
      console.error('Reject invite failed:', err);
      showNotification('Failed to reject invite', 'error');
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

  // Ensure the displayed user workspaces fit into the page slots (counting CreateWorkspaceCard as one slot)
  const displayedUserWorkspaces = useMemo(() => {
    const slots = user ? Math.max(1, WORKSPACES_PER_PAGE - 1) : WORKSPACES_PER_PAGE;
    return userWorkspacesFilteredByView.slice(0, slots);
  }, [userWorkspacesFilteredByView, user]);

  // Filter public workspaces (exclude ones user already joined)
  const filteredPublicWorkspaces = useMemo(() => {
    return publicWorkspaces.filter((workspace) => {
      // Determine membership from the workspace's authorizedUsers field
      const isMember = user ? (workspace.authorizedUsers || []).includes(user.id) : false;
      // Apply search filter
      const matchesSearch = filterWorkspace(workspace);

      return !isMember && matchesSearch;
    });
  }, [publicWorkspaces, normalizedSearchTerm, user]);

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
                  ? `Workspaces you're a member of (${userWorkspacesPagination?.totalCount || userWorkspaces.length})`
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
            {/* Always show Create Card if user is logged in - first slot */}
            {user && <CreateWorkspaceCard />}

            {!user ? (
              <p className="col-span-full text-gray-500 text-center py-8">
                Please log in to view your workspaces.
              </p>
            ) : userWorkspacesLoading ? (
              <div className="col-span-full text-center py-8 text-gray-600">
                Loading your workspaces...
              </div>
            ) : userWorkspacesFilteredByView.length > 0 ? (
              displayedUserWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  id={workspace.id}
                  title={workspace.name}
                  description={workspace.description}
                  members={workspace.authorizedUsers?.length || 0}
                  authorizedUsers={workspace.authorizedUsers}
                  blockedUsers={workspace.blockedUsers}
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
          </div>

          {/* Pagination Controls for User Workspaces */}
          {user && userWorkspacesPagination && userWorkspacesPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setUserWorkspacesPage(Math.max(1, userWorkspacesPage - 1))}
                disabled={userWorkspacesPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 font-medium">
                Page {userWorkspacesPage} of {userWorkspacesPagination.totalPages}
              </span>
              <button
                onClick={() => setUserWorkspacesPage(Math.min(userWorkspacesPagination.totalPages, userWorkspacesPage + 1))}
                disabled={userWorkspacesPage === userWorkspacesPagination.totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </section>

        {/* Pending Invites Section (shows joinable workspaces invited to) */}
        {user && joinableWorkspaces.length > 0 && (
          <section className="px-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Invitations</h2>
                <p className="mt-1 text-gray-600">Workspaces you've been invited to — accept or reject.</p>
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {joinableWorkspaces.map((ws) => (
                <div key={ws.id} className="w-full bg-white rounded-xl shadow-lg p-4 border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-blue-600 bg-blue-50 rounded-full p-2">🔔</div>
                        <span className="text-lg font-semibold text-gray-900">{ws.name || `Workspace ${ws.id}`}</span>
                        {ws.isPrivate && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Private</span>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{ws.description || 'You were invited to this workspace.'}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => acceptInvite(ws.id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">Accept</button>
                    <button onClick={() => rejectInvite(ws.id)} className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg">Reject</button>
                  </div>
                </div>
              ))}
            </div>

              {/* Pagination Controls for Joinable/Invitations */}
              {joinableWorkspacesPagination && joinableWorkspacesPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setJoinableWorkspacesPage(Math.max(1, joinableWorkspacesPage - 1))}
                    disabled={joinableWorkspacesPage === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 font-medium">
                    Page {joinableWorkspacesPage} of {joinableWorkspacesPagination.totalPages}
                  </span>
                  <button
                    onClick={() => setJoinableWorkspacesPage(Math.min(joinableWorkspacesPagination.totalPages, joinableWorkspacesPage + 1))}
                    disabled={joinableWorkspacesPage === joinableWorkspacesPagination.totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
          </section>
        )}

        {/* 'Invited Workspaces' duplicate removed — keep the main 'Invitations' section above */}

        <section className="col-span-full w-full px-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Discover Workspaces
            </h2>
            <p className="mt-2 text-gray-600 text-lg">
              Find and join new workspaces ({publicWorkspacesPagination?.totalCount || 0}{" "}
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
              filteredPublicWorkspaces.map((workspace) => {
                const isMember = user ? (workspace.authorizedUsers || []).includes(user.id) : false;

                // If the workspace is private and the current user is NOT a member,
                // render a simplified orange card that allows the user to request access.
                if (workspace.isPrivate && !isMember) {
                  return (
                    <div key={workspace.id} className="w-full min-w-0 min-h-[15rem] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 p-4 flex flex-col justify-between border border-orange-100">
                      {/* Header with icon and privacy indicator */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">     
                          <div className="text-orange-600 bg-orange-50 rounded-full p-2">
                            🔒
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{workspace.name}</span>
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Private</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 flex-grow">{workspace.description}</p>

                      {/* Request button */}
                      <button
                        onClick={() => requestJoinWorkspace(workspace.id)}
                        className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-150 font-medium mb-3"
                      >
                        Request to Join
                      </button>

                      {/* Footer info with member count */}
                      <div className="pt-3 border-t border-orange-50 flex justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>{workspace.authorizedUsers?.length || "?"} members</span>
                        </div>
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
                  : "No public workspaces available to join."}
              </div>
            )}
          </div>

          {/* Pagination Controls for Public Workspaces */}
          {publicWorkspacesPagination && publicWorkspacesPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPublicWorkspacesPage(Math.max(1, publicWorkspacesPage - 1))}
                disabled={publicWorkspacesPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 font-medium">
                Page {publicWorkspacesPage} of {publicWorkspacesPagination.totalPages}
              </span>
              <button
                onClick={() => setPublicWorkspacesPage(Math.min(publicWorkspacesPagination.totalPages, publicWorkspacesPage + 1))}
                disabled={publicWorkspacesPage === publicWorkspacesPagination.totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </section>
      </div>
    </Card>
  );
};
