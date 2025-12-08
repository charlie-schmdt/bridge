import React, { useState } from "react";
import { Button } from "@heroui/react";
import { Endpoints } from "@/utils/endpoints";

interface Props {
  workspaceId: string;
  onInviteSuccess?: (invitedUser: {
    id: string;
    name?: string;
    email: string;
  }) => void;
  onNotify?: (message: string, type?: string) => void;
}

const InviteUser: React.FC<Props> = ({ workspaceId, onInviteSuccess, onNotify }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      onNotify?.('Please enter an email address.', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("bridge_token");
      const resp = await fetch(`${Endpoints.WORKSPACE}/${workspaceId}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        // Notify parent via callback (will show banner)
        onNotify?.('Invitation sent (pending acceptance)', 'success');
        setEmail("");
        onInviteSuccess?.(
          data.invitedUser || {
            id: data.invitedUser?.id,
            name: data.invitedUser?.name,
            email,
          }
        );
      } else {
        onNotify?.(data.message || 'Failed to send invite', 'error');
      }
    } catch (err: any) {
      onNotify?.(err?.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="email"
        placeholder="Invite by email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 w-56 focus:ring-2 focus:ring-blue-500"
        aria-label="Invite by email"
      />
      <Button color="primary" onPress={handleInvite} disabled={loading}>
        {loading ? "Inviting..." : "Invite"}
      </Button>
    </div>
  );
};

export default InviteUser;
