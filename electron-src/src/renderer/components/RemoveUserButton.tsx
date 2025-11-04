// Create: components/RemoveUserButton.tsx
import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { UserMinus, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RemoveUserButtonProps {
  workspaceId: string;
  userId: string;
  userName: string;
  isCurrentUserOwner: boolean;
  isTargetUserOwner: boolean;
  onRemoveSuccess?: (userId: string) => void;
}

export const RemoveUserButton: React.FC<RemoveUserButtonProps> = ({
  workspaceId,
  userId,
  userName,
  isCurrentUserOwner,
  isTargetUserOwner,
  onRemoveSuccess
}) => {
  const { user } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show button if:
  // 1. Current user is not the owner
  // 2. Target user is the owner
  // 3. User trying to remove themselves
  if (!isCurrentUserOwner || isTargetUserOwner || userId === user?.id) {
    return null;
  }

  const handleRemoveUser = async () => {
    if (!user) {
      setError('You must be logged in to remove users');
      return;
    }

    setIsRemoving(true);
    setError(null);

    try {
      const token = localStorage.getItem('bridge_token');
      
      const response = await fetch(`http://localhost:3000/api/workspace/${workspaceId}/member/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Successfully removed user ${userName} from workspace`);
        
        // Call success callback if provided
        if (onRemoveSuccess) {
          onRemoveSuccess(userId);
        }
        
        setShowConfirmation(false);
        
      } else {
        throw new Error(data.message || 'Failed to remove user');
      }

    } catch (error) {
      console.error('❌ Remove user error:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove user');
    } finally {
      setIsRemoving(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="text-red-500" size={16} />
          <h4 className="font-medium text-red-900 text-sm">Remove User</h4>
        </div>
        <p className="text-xs text-red-700 mb-3">
          Remove "{userName}" from this workspace? They'll lose access immediately.
        </p>
        
        {error && (
          <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
            {error}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            color="danger"
            size="sm"
            onPress={handleRemoveUser}
            isLoading={isRemoving}
            startContent={!isRemoving && <UserMinus size={12} />}
            className="text-xs px-2 py-1 h-6"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
          <Button
            variant="bordered"
            size="sm"
            onPress={() => {
              setShowConfirmation(false);
              setError(null);
            }}
            isDisabled={isRemoving}
            className="text-xs px-2 py-1 h-6"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      color="danger"
      variant="light"
      size="sm"
      onPress={() => setShowConfirmation(true)}
      startContent={<Trash2 size={12} />}
      className="text-xs px-2 py-1 h-6 text-red-600 hover:bg-red-50"
    >
      Remove
    </Button>
  );
};

export default RemoveUserButton;