import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { Endpoints } from "@/utils/endpoints";

interface EditPermissionsModalProps {
  workspaceId: string;
  member: {
    id: string;
    name: string;
    permissions?: {
      canCreateRooms?: boolean;
      canDeleteRooms?: boolean;
      canEditWorkspace?: boolean;
    };
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updated: any) => void;
}

export default function EditPermissionsModal({
  workspaceId,
  member,
  isOpen,
  onOpenChange,
  onSave,
}: EditPermissionsModalProps) {
  const [canCreateRooms, setCanCreateRooms] = useState(false);
  const [canDeleteRooms, setCanDeleteRooms] = useState(false);
  const [canEditWorkspace, setCanEditWorkspace] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load permissions when modal opens
  useEffect(() => {
    if (!isOpen || !member) return;

    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem("bridge_token");
        const res = await fetch(
          `${Endpoints.WORKSPACES}/${workspaceId}/permissions/${member.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();

        if (data.success) {
          const p = data.permissions || {};
          setCanCreateRooms(p.canCreateRooms || false);
          setCanDeleteRooms(p.canDeleteRooms || false);
          setCanEditWorkspace(p.canEditWorkspace || false);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPermissions();
  }, [isOpen, member, workspaceId]);


  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("bridge_token");
      const res = await fetch(
        `${Endpoints.WORKSPACES}/${workspaceId}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: member.id,
            permissions: {
              canCreateRooms,
              canDeleteRooms,
              canEditWorkspace,
            },
          }),
        }
      );

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      if (onSave) onSave(data.permissions);

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to update permissions");
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
              Edit Permissions – {member.name}
            </ModalHeader>

            <ModalBody>
              {error && (
                <div className="p-2 bg-red-100 text-red-700 border rounded text-sm">
                  {error}
                </div>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={canCreateRooms}
                  onChange={(e) => setCanCreateRooms(e.target.checked)}
                />
                <span>Allow creating rooms</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={canDeleteRooms}
                  onChange={(e) => setCanDeleteRooms(e.target.checked)}
                />
                <span>Allow deleting rooms</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={canEditWorkspace}
                  onChange={(e) => setCanEditWorkspace(e.target.checked)}
                />
                <span>Allow editing workspace</span>
              </label>
            </ModalBody>

            <ModalFooter>
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
