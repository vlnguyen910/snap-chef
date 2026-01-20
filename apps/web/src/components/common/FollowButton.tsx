import { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { followUser, unfollowUser } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/authContext';

interface FollowButtonProps {
  userId: string;
  initialIsFollowed?: boolean;
  onFollowChange?: (isFollowed: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * Render a follow/unfollow button for a target user with optimistic updates and an authentication guard.
 *
 * Performs an optimistic toggle of the follow state, calls the appropriate follow/unfollow service,
 * reverts the state on error, and redirects unauthenticated users to the sign-in page.
 *
 * @param userId - ID of the user to follow or unfollow
 * @param initialIsFollowed - Initial follow state shown by the button (defaults to `false`)
 * @param onFollowChange - Optional callback invoked with the new follow state after a successful toggle
 * @param size - Button size: `'sm' | 'default' | 'lg'` (defaults to `'default'`)
 * @param showIcon - Whether to display the follow/unfollow icon (defaults to `true`)
 * @param className - Additional CSS class names applied to the button
 * @returns The Follow/Unfollow button element, or `null` when viewing the current user's own profile
 */
export default function FollowButton({
  userId,
  initialIsFollowed = false,
  onFollowChange,
  size = 'default',
  showIcon = true,
  className = '',
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/signin';
      return;
    }

    // Optimistic UI update
    const previousState = isFollowed;
    setIsFollowed(!isFollowed);
    setIsLoading(true);

    try {
      if (isFollowed) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }

      // Notify parent component of the change
      if (onFollowChange) {
        onFollowChange(!previousState);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert optimistic update on error
      setIsFollowed(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render button if viewing own profile
  if (user && user.id === userId) {
    return null;
  }

  return (
    <Button
      size={size}
      variant={isFollowed ? 'outline' : 'default'}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        'Loading...'
      ) : isFollowed ? (
        <>
          {showIcon && <UserMinus className="h-4 w-4 mr-1" />}
          Unfollow
        </>
      ) : (
        <>
          {showIcon && <UserPlus className="h-4 w-4 mr-1" />}
          Follow
        </>
      )}
    </Button>
  );
}