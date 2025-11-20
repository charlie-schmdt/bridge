// RoomEdit.tsx
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { Button } from "@/renderer/components/ui/Button";
import { Endpoints } from "@/renderer/utils/endpoints";

export interface Room {
  id: string;
  title: string;
  description: string;
  categories?: string[];
  status: "active" | "scheduled" | "offline";
  meetings?: string;
}

interface RoomEditModalProps {
  room: Room;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedRoom: Room) => void;
  onSuccess?: () => void;
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
  const [meetings, setMeetings] = useState(room.meetings || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  


  useEffect(() => {
    if (isOpen) {
      // Reset fields when modal opens
      setTitle(room.title);
      setDescription(room.description);
      setCategories(room.categories || []);
      setStatus(room.status);
      setMeetings(room.meetings || "");
    }
  }, [isOpen, room]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    console.log("Saving room with data:", {
      id: room.id,
      title,
      description,
      categories,
      status,
      meetings,
    });
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

      if (!data.success) throw new Error(data.message || "Failed to update room");

      if (onSave) onSave(data.room || { ...room, title, description, categories, status });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>

        {(close) => (
          
          <>
            <ModalHeader className="flex flex-col gap-1">
              Edit Room – {room.title}
            </ModalHeader>

            <ModalBody>
              {error && (
                <div className="p-2 bg-red-100 text-red-700 border rounded text-sm mb-2">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="flex flex-col text-sm">
                  Title
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border rounded p-1 mt-1"
                  />
                </label>

                <label className="flex flex-col text-sm">
                  Description
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border rounded p-1 mt-1 resize-none"
                  />
                </label>

                <label className="flex flex-col text-sm">
                  Categories (comma-separated)
                  <input
                    type="text"
                    value={categories.join(", ")}
                    onChange={(e) =>
                      setCategories(
                        e.target.value.split(",").map((c) => c.trim()).filter(Boolean)
                      )
                    }
                    className="border rounded p-1 mt-1"
                  />
                </label>

                <label className="flex flex-col text-sm">
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Room["status"])}
                    className="border rounded p-1 mt-1"
                  >
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="offline">Offline</option>
                  </select>
                </label>
              </div>
            </ModalBody>

            <ModalFooter className="flex justify-end gap-2">
              <Button variant="flat" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button isLoading={loading} onPress={handleSave}>
                Save
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
