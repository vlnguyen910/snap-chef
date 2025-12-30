import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '@/services/userService';
import type { SearchUsersParams } from '@/types';

/**
 * Custom hooks for user-related features using TanStack Query
 */

// ============================================
// Query Keys
// ============================================

export const userKeys = {
  all: ['users'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
  search: (params: SearchUsersParams) => [...userKeys.all, 'search', params] as const,
  following: () => [...userKeys.all, 'following'] as const,
  followers: () => [...userKeys.all, 'followers'] as const,
};

// ============================================
// User Profile Hooks
// ============================================

/**
 * Hook to fetch user profile
 */
export function useUserProfile(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => userService.getUserProfile(userId),
    enabled: options?.enabled !== false && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to search users
 */
export function useSearchUsers(params: SearchUsersParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.search(params),
    queryFn: () => userService.searchUsers(params),
    enabled: options?.enabled !== false && params.q.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// Follow Hooks
// ============================================

/**
 * Hook to fetch following list
 */
export function useFollowing() {
  return useQuery({
    queryKey: userKeys.following(),
    queryFn: userService.getFollowing,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch followers list
 */
export function useFollowers() {
  return useQuery({
    queryKey: userKeys.followers(),
    queryFn: userService.getFollowers,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to follow a user
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.followUser(userId),
    onSuccess: (_data: void, userId: string) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: userKeys.following() });
      queryClient.invalidateQueries({ queryKey: userKeys.followers() });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
    onError: (error: any) => {
      console.error('Follow user error:', error);
      window.toast?.error?.(error.message || 'Failed to follow user');
    },
  });
}

/**
 * Hook to unfollow a user
 */
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userService.unfollowUser(userId),
    onSuccess: (_data: void, userId: string) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: userKeys.following() });
      queryClient.invalidateQueries({ queryKey: userKeys.followers() });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
    onError: (error: any) => {
      console.error('Unfollow user error:', error);
      window.toast?.error?.(error.message || 'Failed to unfollow user');
    },
  });
}

/**
 * Combined hook for follow/unfollow toggle
 */
export function useToggleFollow() {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const toggleFollow = (userId: string, currentlyFollowing: boolean) => {
    if (currentlyFollowing) {
      return unfollowMutation.mutate(userId);
    } else {
      return followMutation.mutate(userId);
    }
  };

  return {
    toggleFollow,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    isSuccess: followMutation.isSuccess || unfollowMutation.isSuccess,
    isError: followMutation.isError || unfollowMutation.isError,
  };
}
