import { Endpoints } from '@/renderer/utils/endpoints';
import { Button } from '@heroui/react';
import { PressEvent } from '@react-types/shared';
import { Star } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface FavoriteButtonProps {
  workspaceId: string;
  isFavorite: boolean;
  onFavoriteToggle?: (workspaceId: string, isFavorite: boolean) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  workspaceId,
  isFavorite,
  onFavoriteToggle
}) => {
  const { user } = useAuth();
  const [isToggling, setIsToggling] = useState(false);
  const [currentFavorite, setCurrentFavorite] = useState(isFavorite);

  const handleToggleFavorite = async (e: PressEvent) => {
    e.continuePropagation();
        
    if (!user || isToggling) return;

    setIsToggling(true);

    try {
      const token = localStorage.getItem('bridge_token');
      
      const response = await fetch(`${Endpoints.WORKSPACE}/${workspaceId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const newFavoriteStatus = data.isFavorite;
        setCurrentFavorite(newFavoriteStatus);
        
        // Call parent callback
        if (onFavoriteToggle) {
          onFavoriteToggle(workspaceId, newFavoriteStatus);
        }
        
        console.log(`✅ ${newFavoriteStatus ? 'Added to' : 'Removed from'} favorites: ${workspaceId}`);
      } else {
        throw new Error(data.message || 'Failed to toggle favorite');
      }

    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      onPress={handleToggleFavorite}
      isLoading={isToggling}
      className={`${currentFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500 transition-colors`}
    >
      <Star 
        size={18} 
        fill={currentFavorite ? 'currentColor' : 'none'}
        className="transition-all duration-200"
      />
    </Button>
  );
};

export default FavoriteButton;