import { useNotification } from "@/hooks/useNotification";
import { Endpoints } from "@/utils/endpoints";
import { Button, Card } from "@heroui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header";
import LeaveWorkspaceButton from "../../components/LeaveWorkspaceButton";
import MembersList from "./MemberList";
import NotificationBanner from "../../components/NotificationBanner";
import { RoomCard } from "./RoomCard";
import { useAuth } from "../../contexts/AuthContext";
import InviteUser from "./InviteUser";
import { Meeting } from "@/utils/meetingUtils";
import { PlusCircle } from "lucide-react";

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  picture?: string;
  isOwner: boolean;
  role: string;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  members: WorkspaceMember[];
  description?: string;
  isPrivate: boolean;
}


export const WorkspaceLayout = () => {
  const { user } = useAuth();
  const { workspaceId } = useParams<{ workspaceId: string }>(); // ← Get ID from URL
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(
    null
  );
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<
    Array<{
      id: string;
      room_id: string;
      name: string;
      description?: string;
      categories?: string[];
      status?: string;
      meetings?: Meeting[];
    }>
  >([]);
  const [isCreateRoomModalOpen, setShowRoomModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomCategories, setRoomCategories] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editMode, setEditMode] = useState(false);
  const { notification, showNotification } = useNotification();
  const [updatedWorkspaceInfo, setUpdatedWorkspaceInfo] =
    useState<WorkspaceInfo | null>(null);

  const [ isRecurring, setIsRecurring] = useState(false);
  const [ meetingDate, setMeetingDate] = useState("");
  const [ meetingTime, setMeetingTime] = useState("");
  const [ repeatInterval, setRepeatInterval] = useState("weekly");

  const [meetings, setMeetings] = useState([
    {
      date: "",
      time: "",
      frequency: "daily",
      daysOfWeek: [],
    },
  ]);

  // Days for clicking buttons
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


  const isCurrentUserOwner =
    user &&
    workspaceInfo?.members.find(
      (member) => member.id === user.id && member.isOwner
    );

  // Fetch workspace data using the ID from URL
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!user || !workspaceId) {
        console.log("Missing user or workspace ID:", {
          user: !!user,
          workspaceId,
        });
        setLoading(false);
        return;
      }

      try {
        console.log(`🔍 Fetching data for workspace ID: ${workspaceId}`);

        const token = localStorage.getItem("bridge_token");
        const response = await fetch(
          `${Endpoints.WORKSPACE}/${workspaceId}/members`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const room_response = await fetch(
          `${Endpoints.WORKSPACE}/${workspaceId}/rooms`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log(room_response);
        if (!response.ok) {
          throw new Error(`Failed to fetch workspace data: ${response.status}`);
        }
        if (!room_response.ok) {
          throw new Error(`Failed to fetch room data: ${room_response.status}`);
        }

        const data = await response.json();
        const room_data = await room_response.json();

        if (data.success) {
          setWorkspaceInfo({
            id: data.workspaceId,
            name: data.workspaceName,
            members: data.members,
            description: data.description,
            isPrivate: data.private,
          });
          setUpdatedWorkspaceInfo({
            id: data.workspaceId,
            name: data.workspaceName,
            members: data.members,
            description: data.description,
            isPrivate: data.private,
          });
          setMembers(data.members);
          console.log("✅ Fetched workspace data:", {
            workspaceId: data.workspaceId,
            name: data.workspaceName,
            memberCount: data.members.length,
          });

          if (room_data.success) {
            setRooms(
              room_data.rooms.filter(
                (room) => room.workspace_id === data.workspaceId
              )
            );
            console.log("✅ Fetched room data:", room_data, "etc: ",  {
              workspaceId: room_data.workspaceId,
              roomCount: room_data.rooms.length,
              rooms:  room_data.rooms.filter(
                (room) => room.workspace_id === data.workspaceId
              )
            });
          } else {
            throw new Error(room_data.message || "Failed to fetch room data");
          }
        } else {
          throw new Error(data.message || "Failed to fetch workspace data");
        }
      } catch (err) {
        console.error("❌ Error fetching workspace data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch workspace data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [user, workspaceId]); // ← Re-run when user or workspaceId changes

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert("Room name is required");
      return;
    }

    try {
      const token = localStorage.getItem("bridge_token");
      const categoryArray = roomCategories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const response = await fetch(`${Endpoints.ROOMS}/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId, // Comes from useParams()
          name: roomName,
          description: roomDescription,
          categories: categoryArray,
          meetings: isRecurring ? meetings : [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRooms((prev) => [...prev, data.room]);
        setShowRoomModal(false);
        setRoomName("");
        setRoomDescription("");
        setRoomCategories("");
        setIsRecurring(false);
        setMeetings([]);
        console.log("✅ Room created successfully:", data.room);
      } else {
        console.error(data.message);
        alert(data.message);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room");
    }
  };

  const handleMeetingChange = (index, field, value) => {
    setMeetings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDayToggle = (index, day) => {
    setMeetings((prev) => {
      const updated = [...prev];
      const days = updated[index].daysOfWeek || [];

      updated[index].daysOfWeek = days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day];

      return updated;
    });
  };

  const removeMeeting = (index) => {
    setMeetings((prev) => prev.filter((_, i) => i !== index));
  };




  const uniqueCategories = Array.from(
    new Set(
      rooms.flatMap((room) =>
        Array.isArray(room.categories)
          ? room.categories
          : room.categories
          ? [room.categories]
          : []
      )
    )
  );

  const filteredRooms = rooms.filter((room) => {
    // Filter by category
    const matchesCategory = selectedCategory
      ? Array.isArray(room.categories)
        ? room.categories.includes(selectedCategory)
        : room.categories === selectedCategory
      : true;

    // Filter by search query
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleSaveWorkspaceChanges = async (
    updatedInfo: WorkspaceInfo | null
  ) => {
    if (!updatedInfo) return;
    try {
      const token = localStorage.getItem("bridge_token");
      const response = await fetch(
        `${Endpoints.WORKSPACE}/${workspaceId}/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: updatedInfo.name,
            description: updatedInfo.description,
            members: updatedInfo.members,
            isPrivate: updatedInfo.isPrivate,
            //room_ids: rooms.map(room => room.id),
          }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setWorkspaceInfo((prev) =>
          prev
            ? {
                ...prev,
                name: updatedInfo.name,
                description: updatedInfo.description,
                members: updatedInfo.members,
                isPrivate: updatedInfo.isPrivate,
              }
            : null
        );
        console.log("✅ Workspace updated successfully:", data.workspace);
        showNotification("Workspace updated successfully!", "success");
      } else {
        console.error(data.message);
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating workspace:", error);
      alert("Failed to update workspace");
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="min-h-screen bg-gray-50">
        <div className="workspace-app">
          <Header />
          <div className="mt-6 px-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading workspace...</p>
            <p className="text-sm text-gray-500">Workspace ID: {workspaceId}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="min-h-screen bg-gray-50">
        <div className="workspace-app">
          <Header />
          <div className="mt-6 px-6 text-center">
            <p className="text-red-600">{error}</p>
            <p className="text-gray-500 mt-2">Workspace ID: {workspaceId}</p>
          </div>
        </div>
      </Card>
    );
  }

  const handleMemberRemoved = (removedUserId: string) => {
    console.log(`Member ${removedUserId} removed from workspace`);

    // Update local state to remove the member
    setMembers((prevMembers) =>
      prevMembers.filter((member) => member.id !== removedUserId)
    );

    // Update workspace info if needed
    if (workspaceInfo) {
      setWorkspaceInfo((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter(
                (member) => member.id !== removedUserId
              ),
            }
          : null
      );
    }
  };

  return (
    <Card className="min-h-screen bg-white">
      <div className="workspace-app">
        {/* Header */}
        <Header />
        {notification && (
          <div className="fixed top-20 right-4 z-[9999]">
            <NotificationBanner
              message={notification.message}
              type={
                notification.type as
                  | "success"
                  | "error"
                  | "warning"
                  | "info"
                  | "created"
              }
            />
          </div>
        )}

        {/* Page title - now shows actual workspace name */}
        <div className="mt-6 px-6">
          <div className="flex flex-col sm:flex-row justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {editMode && (
                <>
                  <input
                    title="Workspace Name"
                    value={updatedWorkspaceInfo?.name || "Workspace Name"}
                    onChange={(e) =>
                      setUpdatedWorkspaceInfo((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    className="ring-2 ring-blue-500 focus:outline-none hover:border-gray-400 w-full"
                  />
                </>
              )}
              {!editMode && <> {workspaceInfo?.name || "Workspace"} </>}
            </h1>
            {isCurrentUserOwner && (
              <>
                <Button
                  className="mt-3 sm:mt-0"
                  color="primary"
                  onPress={() => setEditMode(true)}
                >
                  Edit Workspace
                </Button>
              </>
            )}
          </div>
          {isCurrentUserOwner && (
            <>
              <span className="ml-2 text-sm text-blue-600 font-medium">
                (Owner)
              </span>
              <p className="mt-6 text-gray-600 text-lg">
                Manage your team members, calls, and workspace access.
                {members.length > 0 &&
                  ` ${members.length} member${members.length !== 1 ? "s" : ""}`}
              </p>
              {editMode && (
                <p className="mt-6 text-gray-600 text-lg">
                  <input
                    title="Workspace Description"
                    value={
                      updatedWorkspaceInfo?.description ||
                      "Workspace Description"
                    }
                    onChange={(e) =>
                      setUpdatedWorkspaceInfo((prev) =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                    className="ring-2 ring-blue-500 focus:outline-none hover:border-gray-400"
                  />
                </p>
              )}
            </>
          )}
          {!isCurrentUserOwner && (
            <>
              <p className="mt-6 text-gray-600 text-lg">
                {workspaceInfo?.description ||
                  "Collaborate with your team in this workspace."}
                {members.length > 0 &&
                  ` ${members.length} member${members.length !== 1 ? "s" : ""}`}
              </p>
            </>
          )}

          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="mt-3 w-1/2 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by room name
              </label>
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-gray-400"
              />
            </div>
            {uniqueCategories.length > 0 && (
              <div className="mt-3 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by category
                </label>
                <select
                  title="Filter by category"
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs focus:ring-2 focus:ring-blue-500 focus:outline-none hover:border-gray-400 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {workspaceInfo && workspaceId && (
          <div>
            <div className="flex justify-between items-center mb-4 mt-6 px-6">
              <div className="flex items-center gap-3">
                {/* <Button
                  color="primary"
                  onPress={setShowRoomModal.bind(null, true)}
                >
                  + Create Room
                </Button> */}
                {/* <div
                  onClick={setShowRoomModal.bind(null, true)}
                  className="group border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white 
                    rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer 
                    p-6 sm:p-8 w-full flex flex-col items-center text-center space-y-3"
                  role="button"
                  tabIndex={0}
                >
                  <PlusCircle className="w-10 h-10 text-blue-500 group-hover:text-blue-600 transition duration-200" />
                  <p className="text-lg font-semibold text-gray-800">Create New Room</p>
                  <p className="text-sm text-gray-500">
                    Quickly set up a new meeting room for your team.
                  </p>
                  <button
                    onClick={setShowRoomModal.bind(null, true)}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer"
                  >
                    Get Started
                  </button>
                </div> */}
                {isCurrentUserOwner && (
                  <InviteUser
                    workspaceId={workspaceId}
                    onInviteSuccess={(invited) => {
                      console.log("Invited user:", invited);
                      // Invitation recorded as pending on the server; do not add to members list.
                      // Optionally show a toast or refresh pending-invites if you add that UI.
                    }}
                  />
                )}
              </div>

              <LeaveWorkspaceButton
                workspaceId={workspaceId}
                workspaceName={workspaceInfo.name}
                isOwner={!!isCurrentUserOwner}
                onLeaveSuccess={() => {
                  console.log("Left workspace successfully");
                }}
              />
            </div>
            {isCreateRoomModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                  <h2 className="text-2xl font-semibold mb-4">
                    Create New Room
                  </h2>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mb-4"
                    placeholder="Enter room name"
                  />

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mb-4"
                    placeholder="Optional description"
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categories (comma separated)
                  </label>
                  <input
                    type="text"
                    value={roomCategories}
                    onChange={(e) => setRoomCategories(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mb-4"
                    placeholder="e.g. Development, Marketing"
                  />

                  {/* ─────────────────────────────────────────── */}
                  {/* RECURRING MEETING SECTION */}
                  {/* ─────────────────────────────────────────── */}

                  <h3 className="text-lg font-semibold mt-4 mb-2">Recurring Meeting</h3>

                  {/* ENABLE TOGGLE */}
                  <div className="flex items-center mb-4">
                    <input
                      title="Enable Recurring Meeting"
                      type="checkbox"
                      checked={isRecurring}
                      onChange={() => setIsRecurring(!isRecurring)}
                      className="mr-2 cursor-pointer"
                    />
                    <label className="text-sm text-gray-700">
                      Set recurring meetings
                    </label>
                  </div>

                  {isRecurring && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Recurring Meetings</h4>

                      {meetings.map((meeting, idx) => (
                        <div key={idx} className="rounded-lg bg-white">
                          {/* Row 1: Date, Time, Frequency */}
                          <div className="flex gap-2 items-center mb-2 cursor-pointer">
                            <input
                              type="date"
                              value={meeting.date}
                              onChange={(e) =>
                                handleMeetingChange(idx, "date", e.target.value)
                              }
                              className="border border-gray-300 rounded p-2"
                              placeholder="YYYY-MM-DD"
                            />

                            <input
                              type="time"
                              value={meeting.time}
                              onChange={(e) =>
                                handleMeetingChange(idx, "time", e.target.value)
                              }
                              className="border border-gray-300 rounded p-2 cursor-pointer"
                              placeholder="HH:MM"
                            />

                            <select
                              title="Select Frequency"
                              value={meeting.frequency}
                              onChange={(e) =>
                                handleMeetingChange(idx, "frequency", e.target.value as any)
                              }
                              className="border border-gray-300 rounded p-2 cursor-pointer"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="biweekly">Biweekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>

                          {/* Row 2: Select Days (if needed) + Remove */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {["weekly", "biweekly"].includes(meeting.frequency) && (
                              <div className="flex flex-wrap gap-1">
                                {days.map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    className={`text-xs px-2 py-1 rounded border border-gray-300 cursor-pointer ${
                                      meeting.daysOfWeek?.includes(d)
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100"
                                    }`}
                                    onClick={() => handleDayToggle(idx, d)}
                                  >
                                    {d}
                                  </button>
                                ))}
                              </div>
                            )}

                            <Button
                              type="button"
                              className="text-red-500 text-sm hover:underline ml-auto bg-transparent cursor-pointer"
                              onPress={() => removeMeeting(idx)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        className="mt-2 text-blue-600 hover:underline text-sm bg-transparent cursor-pointer"
                        onPress={() =>
                          setMeetings([
                            ...meetings,
                            { date: "", time: "", frequency: "daily", daysOfWeek: [] },
                          ])
                        }
                      >
                        + Add Meeting
                      </Button>
                    </div>
                  )}
                  {/* ─────────────────────────────────────────── */}

                  <div className="flex justify-end space-x-2">
                    <Button
                      onPress={() => setShowRoomModal(false)}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleCreateRoom}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main content: Room cards + Members list */}
        <div className="flex flex-col lg:flex-row gap-6 mt-6 px-6 mb-4">
          {/* Left: Room cards (75%) */}
          <div className="lg:w-3/4 w-full">
            {rooms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(10rem,_1fr)]">
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <RoomCard
                      room_id={room.room_id}
                      key={room.id}
                      id={room.room_id}
                      title={room.name}
                      categories={room.categories || []}
                      description={
                        room.description || "No description provided"
                      }
                      status={
                        (room.status as "active" | "scheduled" | "offline") ||
                        "offline"
                      }
                      meetings={
                        Array.isArray(room.meetings) 
                          ? room.meetings 
                          : [] // Pass empty array if meetings is a string or undefined
                      }
                      editMode={editMode}
                    />
                  ))
                ) : (
                  <p className="text-gray-500">No rooms match this category.</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 col-span-full">No rooms match this category.</p>
            )}

            {/* Add the CreateRoomCard at the end of the grid */}
            {/* <CreateRoomCard /> */}
            <div
                  onClick={setShowRoomModal.bind(null, true)}
                  className="group border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white 
                    rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer 
                    p-6 sm:p-8 w-full flex flex-col items-center text-center space-y-3"
                  role="button"
                  tabIndex={0}
                >
                  <PlusCircle className="w-10 h-10 text-blue-500 group-hover:text-blue-600 transition duration-200" />
                  <p className="text-lg font-semibold text-gray-800">Create New Room</p>
                  <p className="text-sm text-gray-500">
                    Quickly set up a new meeting room for your team.
                  </p>
                  <button
                    onClick={setShowRoomModal.bind(null, true)}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer"
                  >
                    Get Started
                  </button>
                </div>
          </div>

          {/* Right: Members list (25%) */}
          <div className="lg:w-1/4 w-full flex justify-end">
            <MembersList
              members={members}
              workspaceId={workspaceId}
              workspaceName={workspaceInfo?.name}
              onMemberRemoved={handleMemberRemoved}
              isEditing={editMode}
            />
          </div>
        </div>

        {isCurrentUserOwner && editMode && (
          <div className="flex justify-end px-6 mb-6">
            <Button
              onPress={() => setEditMode(false)}
              className="mr-4 text-black-500 bg-gray-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => {
                // Implement save logic here
                console.log("Saving workspace changes:", updatedWorkspaceInfo);
                setEditMode(false);
                handleSaveWorkspaceChanges(updatedWorkspaceInfo);
              }}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
