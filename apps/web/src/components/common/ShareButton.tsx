import { Share2 } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { api } from '@/lib/axios';
import { useState } from 'react';

interface ShareButtonProps {
  recipeId: string;
  recipeTitle: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ShareButton({ 
  recipeId, 
  recipeTitle, 
  size = 'md',
  showLabel = false 
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const sizeClasses = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = sizeClasses[size];

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a Link
    e.stopPropagation();

    if (isSharing) return;

    setIsSharing(true);

    try {
      // Generate recipe URL
      const recipeUrl = `${window.location.origin}/recipes/${recipeId}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(recipeUrl);
      
      toast.success('🔗 Link copied to clipboard!');

      // Optional: Track share count on backend (fire and forget)
      try {
        await api.post(`/recipes/${recipeId}/share`);
      } catch (error) {
        // Silently fail - not critical
        console.log('Share tracking failed:', error);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 group"
      title="Share recipe"
    >
      <Share2 
        size={iconSize} 
        className="text-gray-500 group-hover:text-blue-600 transition-colors"
      />
      {showLabel && (
        <span className="text-sm text-gray-600 group-hover:text-blue-600">
          Share
        </span>
      )}
    </button>
  );
}
