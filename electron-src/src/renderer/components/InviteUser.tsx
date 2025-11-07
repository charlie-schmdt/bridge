import React, { useState } from "react";
import { Button } from "@heroui/react";
import { Endpoints } from "@/utils/endpoints";

interface Props {
  workspaceId: string;
  onInviteSuccess?: (invitedUser: { id: string; name?: string; email: string }) => void;
}

const InviteUser: React.FC<Props> = ({ workspaceId, onInviteSuccess }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = async () => {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError("Please enter an email address.");
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
        setSuccess("Invitation sent — user added to workspace.");
        setEmail("");
        onInviteSuccess?.(data.invitedUser || { id: data.invitedUser?.id, name: data.invitedUser?.name, email });
      } else {
        setError(data.message || "Failed to invite user");
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}
    </div>
  );
};

export default InviteUser;
