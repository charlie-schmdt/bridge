import React, { useEffect, useState } from "react";
import { Button } from "@/renderer/components/ui/Button";
import { Endpoints } from "@/renderer/utils/endpoints";

const defaultMeetings: {
  date: string;
  time: string;
  frequency: string;
  daysOfWeek?: string[];
}[] = [];

export interface Room {
  id: string;
  title: string;
  description: string;
  categories?: string[];
  status: "active" | "scheduled" | "offline";
  meetings?: typeof defaultMeetings;
}

interface RoomEditModalProps {
  room: Room;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedRoom: Room) => void;
  onSuccess?: () => void;
}

interface RecurringMeeting {
  date: string; // start date YYYY-MM-DD
  time: string; // HH:MM
  frequency: "daily" | "weekly" | "biweekly" | "bimonthly" | "monthly";
  daysOfWeek?: string[]; // Only for weekly or longer frequencies
}

export default function EditRoomModal({
  room,
  isOpen,
  onOpenChange,
  onSave,
  onSuccess,
}: RoomEditModalProps) {
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description);
  const [categories, setCategories] = useState(room.categories || []);
  const [status, setStatus] = useState<Room["status"]>(room.status);
  const [meetings, setMeetings] = useState<RecurringMeeting[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleDayToggle = (idx: number, day: string) => {
    const updated = [...meetings];
    const currentDays = updated[idx].daysOfWeek || [];
    if (currentDays.includes(day)) {
      updated[idx].daysOfWeek = currentDays.filter((d) => d !== day);
    } else {
      updated[idx].daysOfWeek = [...currentDays, day];
    }
    setMeetings(updated);
  };

  useEffect(() => {
    if (isOpen) {
      setTitle(room.title);
      setDescription(room.description);
      setCategories(room.categories || []);
      setStatus(room.status);

      // Parse existing meeting info if available
      try {
        const parsedMeetingsRaw = room.meetings ? room.meetings : [];
        const parsedMeetings: RecurringMeeting[] = parsedMeetingsRaw.map((m) => ({
          date: (m as any).startDate ?? (m as any).date ?? "",
          time: m.time ?? "",
          frequency: (["daily", "weekly", "biweekly", "bimonthly", "monthly"].includes(
            m.frequency
          )
            ? (m.frequency as RecurringMeeting["frequency"])
            : "weekly"),
          daysOfWeek: m.daysOfWeek,
        }));
        setMeetings(parsedMeetings);
      } catch {
        setMeetings([]);
      }
    }
  }, [isOpen, room]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bridge_token");
      const res = await fetch(`${Endpoints.ROOMS}/edit/${room.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          categories,
          status,
          meetings: meetings,
        }),
      });

      const data = await res.json();

      if (!data.success)
        throw new Error(data.message || "Failed to update room");
      console.log("✅ Room updated:", data.room);
      if (onSave)
        onSave(
          data.room || {
            ...room,
            title,
            description,
            categories,
            status,
            meetings: meetings,
          }
        );
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update room");
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingChange = (
    index: number,
    field: keyof RecurringMeeting,
    value: string
  ) => {
    const updated = [...meetings];
    updated[index] = { ...updated[index], [field]: value };
    setMeetings(updated);
  };

  const addMeeting = () => {
    setMeetings([...meetings, { date: "", time: "", frequency: "weekly" }]);
  };

  const removeMeeting = (index: number) => {
    setMeetings(meetings.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Edit Room – {room.title}
        </h2>

        {error && (
          <div className="p-2 bg-red-100 text-red-700 border rounded text-sm mb-2">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 mb-4"
          placeholder="Enter room title"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 mb-4 resize-none"
          placeholder="Optional description"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categories (comma separated)
        </label>
        <input
          type="text"
          value={categories.join(", ")}
          onChange={(e) =>
            setCategories(
              e.target.value
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            )
          }
          className="w-full border border-gray-300 rounded-md p-2 mb-4"
          placeholder="e.g. Development, Marketing"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          title="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Room["status"])}
          className="w-full border border-gray-300 rounded-md p-2 mb-4"
        >
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="offline">Offline</option>
        </select>

        <div className="mt-4">
          <h4 className="font-medium mb-2">Recurring Meetings</h4>
          {meetings.map((meeting, idx) => (
            <div key={idx} className="mb-4">
              {/* First row: date, time, frequency */}
              <div className="flex gap-2 items-center mb-1">
                <input
                  type="date"
                  value={meeting.date}
                  onChange={(e) =>
                    handleMeetingChange(idx, "date", e.target.value)
                  }
                  className="border rounded p-1"
                  title={`Meeting date ${idx + 1}`}
                  placeholder="YYYY-MM-DD"
                />
                <input
                  type="time"
                  value={meeting.time}
                  onChange={(e) =>
                    handleMeetingChange(idx, "time", e.target.value)
                  }
                  className="border rounded p-1"
                  title={`Meeting time ${idx + 1}`}
                  placeholder="HH:MM"
                />
                <select
                  title="Frequency"
                  value={meeting.frequency}
                  onChange={(e) =>
                    handleMeetingChange(idx, "frequency", e.target.value as any)
                  }
                  className="border rounded p-1"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Second row: days of week + remove button */}
              <div className="flex gap-2 items-center flex-wrap">
                {["weekly", "biweekly", "monthly"].includes(
                  meeting.frequency
                ) && (
                  <div className="flex gap-1 flex-wrap">
                    {days.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`text-xs px-2 py-1 rounded border ${
                          meeting.daysOfWeek?.includes(d)
                            ? "bg-blue-600 text-white"
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
                  className="text-red-500 hover:underline text-sm"
                  onClick={() => removeMeeting(idx)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <Button
            className="mt-2 text-blue-600 hover:underline text-sm"
            onClick={() =>
              setMeetings([
                ...meetings,
                { date: "", time: "", frequency: "daily" },
              ])
            }
          >
            + Add Meeting
          </Button>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
