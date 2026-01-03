import { api } from '@/lib/axios';
import type { UserProfile, FollowUser, SearchUsersParams, SearchUserResult, UserSummary } from '@/types';

/**
 * User Service
 * Handles user profile, search, and follow-related API calls
 */

// ============================================
// User Profile APIs
// ============================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await api.get<UserProfile>(`/users/${userId}/profile`);
  return response;
}

/**
 * Search users by keyword with pagination
 * Returns array of { id, username, avatar_url }
 */
export async function searchUsers(params: SearchUsersParams): Promise<SearchUserResult[]> {
  const { q, page = 1, limit = 10 } = params;
  const response = await api.get<SearchUserResult[]>('/users', {
    params: { search: q, page, limit }
  });
  return response;
}

// ============================================
// Follow APIs
// ============================================

/**
 * Get list of users that a specific user is following
 * Auth: Optional (sends token if logged in to get correct is_followed status)
 */
export async function getUserFollowing(userId: string, page: number = 0, limit: number = 15): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>(`/users/${userId}/following`, {
    params: { page, limit }
  });
  return response;
}

/**
 * Get list of users that follow a specific user
 * Auth: Optional (sends token if logged in to get correct is_followed status)
 */
export async function getUserFollowers(userId: string, page: number = 0, limit: number = 15): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>(`/users/${userId}/followers`, {
    params: { page, limit }
  });
  return response;
}

/**
 * Get list of users that the current user is following (deprecated - use getUserFollowing with userId)
 */
export async function getFollowing(): Promise<FollowUser[]> {
  const response = await api.get<FollowUser[]>('/me/following');
  return response;
}

/**
 * Get list of users that follow the current user (deprecated - use getUserFollowers with userId)
 */
export async function getFollowers(): Promise<FollowUser[]> {
  const response = await api.get<FollowUser[]>('/me/followers');
  return response;
}

/**
 * Follow a user (backend handles toggle)
 */
export async function followUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/follow`);
}

/**
 * Unfollow a user (backend handles toggle - same endpoint as follow)
 */
export async function unfollowUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/follow`);
}

/**
 * Check if current user follows a specific user
 */
export async function checkIsFollowing(userId: string): Promise<boolean> {
  try {
    const response = await api.get<{ is_following: boolean }>(`/users/${userId}/is-following`);
    return response.is_following;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}
