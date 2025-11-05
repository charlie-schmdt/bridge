// Create: components/LeaveWorkspaceButton.tsx
import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Endpoints } from '@/utils/endpoints';

interface LeaveWorkspaceButtonProps {
  workspaceId: string;
  workspaceName: string;
  isOwner?: boolean;
  onLeaveSuccess?: () => void;
}

export const LeaveWorkspaceButton: React.FC<LeaveWorkspaceButtonProps> = ({
  workspaceId,
  workspaceName,
  isOwner = false,
  onLeaveSuccess
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show button if user is owner
  if (isOwner) {
    return null;
  }

  const handleLeaveWorkspace = async () => {
    if (!user) {
      setError('You must be logged in to leave a workspace');
      return;
    }

    setIsLeaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('bridge_token');
      
      const response = await fetch(`${Endpoints.WORKSPACE}${workspaceId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Successfully left workspace:', workspaceName);
        
        // Call success callback if provided
        if (onLeaveSuccess) {
          onLeaveSuccess();
        }
        
        // Navigate back to home after leaving
        setTimeout(() => {
          navigate('/');
        }, 1000);
        
      } else {
        throw new Error(data.message || 'Failed to leave workspace');
      }

    } catch (error) {
      console.error('❌ Leave workspace error:', error);
      setError(error instanceof Error ? error.message : 'Failed to leave workspace');
    } finally {
      setIsLeaving(false);
      setShowConfirmation(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6 px-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="text-red-500" size={20} />
          <h4 className="font-medium text-red-900">Leave Workspace</h4>
        </div>
        <p className="text-sm text-red-700 mb-4">
          Are you sure you want to leave "{workspaceName}"? You'll lose access to all rooms and conversations.
        </p>
        
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
            {error}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            color="danger"
            size="sm"
            onPress={handleLeaveWorkspace}
            isLoading={isLeaving}
            startContent={!isLeaving && <LogOut size={14} />}
          >
            {isLeaving ? 'Leaving...' : 'Yes, Leave'}
          </Button>
          <Button
            variant="bordered"
            size="sm"
            onPress={() => {
              setShowConfirmation(false);
              setError(null);
            }}
            isDisabled={isLeaving}
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
      variant="bordered"
      size="sm"
      onPress={() => setShowConfirmation(true)}
      startContent={<LogOut size={16} />}
      className="text-red-600 border-red-300 hover:bg-red-50"
    >
      Leave Workspace
    </Button>
  );
};

export default LeaveWorkspaceButton;