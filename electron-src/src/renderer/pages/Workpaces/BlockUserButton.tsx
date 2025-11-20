import { Endpoints } from "@/renderer/utils/endpoints";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { ShieldBan, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface BlockeUserButtonProps {
  workspaceId: string;
  userId: string;
  userName: string;
  isCurrentUserOwner: boolean;
  isTargetUserOwner: boolean;
  currentRole: string;
  onRoleChange?: (userId: string, newRole: string) => void;
}

export const BlockUserButton: React.FC<BlockeUserButtonProps> = ({
  workspaceId,
  userId,
  userName,
  isCurrentUserOwner,
  isTargetUserOwner,
  currentRole,
  onRoleChange,
}) => {
  const { user } = useAuth();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCurrentUserOwner || isTargetUserOwner || userId === user?.id) {
    return null;
  }

  const isBlocked = currentRole === "Blocked";
  const newRole = isBlocked ? "Member" : "Blocked";
  const actionVerb = isBlocked ? "Unblock" : "Block";

  const icon = isBlocked ? <ShieldCheck size={12} /> : <ShieldBan size={12} />;
  const color = isBlocked ? "success" : "warning";

  const handleToggle = async () => {
    if (!user) {
      setError("You must be logged in to modify user role.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem("bridge_token");

      const response = await fetch(
        `${Endpoints.WORKSPACE}/${workspaceId}/member/${userId}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (onRoleChange) onRoleChange(userId, newRole);
      } else {
        throw new Error(data.message || "Failed to update user role.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Button that opens the modal */}
      <Button
        color={color}
        variant="light"
        size="sm"
        onPress={onOpen}
        startContent={icon}
        className={`text-xs px-2 py-1 h-6 ${
          isBlocked ? "text-green-700 hover:bg-green-50" : "text-yellow-700 hover:bg-yellow-50"
        }`}
      >
        {actionVerb}
      </Button>

      {/* Popup modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {actionVerb} User
              </ModalHeader>

              <ModalBody>
                <p className="text-sm text-gray-700">
                  {isBlocked
                    ? `Restore access for "${userName}"?`
                    : `Block "${userName}" from this workspace? They will lose access temporarily.`}
                </p>

                {error && (
                  <div className="p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
                    {error}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  isDisabled={isProcessing}
                >
                  Cancel
                </Button>

                <Button
                  color={color}
                  onPress={async () => {
                    await handleToggle();
                    onClose();
                  }}
                  isLoading={isProcessing}
                  startContent={!isProcessing && icon}
                >
                  {isProcessing ? `${actionVerb}ing...` : actionVerb}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default BlockUserButton;
