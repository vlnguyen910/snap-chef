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
 * Fetches the profile for the specified user.
 *
 * @returns The requested user's profile.
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await api.get<UserProfile>(`/users/${userId}/profile`);
  return response;
}

/**
 * Searches users by keyword and returns paginated results.
 *
 * @param params - Search parameters: `q` is the query string, `page` (default 1) is the page number, and `limit` (default 10) is the page size.
 * @returns An array of SearchUserResult objects containing `id`, `username`, and `avatar_url`.
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
 * Fetches the list of users followed by a given user.
 *
 * Auth is optional; if the caller is authenticated the response may include fields
 * that reflect the current user's relation to each returned user (e.g., `is_followed`).
 *
 * @param userId - ID of the user whose following list to retrieve
 * @param page - Page index for pagination (default: 0)
 * @param limit - Maximum number of results to return per page (default: 15)
 * @returns An array of `UserSummary` objects representing users followed by the specified user
 */
export async function getUserFollowing(userId: string, page: number = 0, limit: number = 15): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>(`/users/${userId}/following`, {
    params: { page, limit }
  });
  return response;
}

/**
 * Fetches the list of users who follow the specified user.
 *
 * Auth is optional; when the caller is authenticated the request includes the token so each returned item reflects the current user's `is_followed` status.
 *
 * @param userId - ID of the user whose followers to retrieve
 * @param page - Page index for pagination (defaults to 0)
 * @param limit - Maximum number of followers to return per page (defaults to 15)
 * @returns An array of `UserSummary` objects representing users following the specified user
 */
export async function getUserFollowers(userId: string, page: number = 0, limit: number = 15): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>(`/users/${userId}/followers`, {
    params: { page, limit }
  });
  return response;
}

/**
 * Retrieve the users the current authenticated user is following (deprecated; use `getUserFollowing` with a specific userId).
 *
 * @deprecated Use `getUserFollowing(userId, page, limit)` to fetch following for a specific user.
 * @returns An array of `FollowUser` objects representing users followed by the current user
 */
export async function getFollowing(): Promise<FollowUser[]> {
  const response = await api.get<FollowUser[]>('/me/following');
  return response;
}

/**
 * Retrieves users who follow the current authenticated user.
 *
 * @deprecated Use `getUserFollowers(userId, page, limit)` to fetch followers for a specific user.
 * @returns An array of `FollowUser` objects representing followers of the current user.
 */
export async function getFollowers(): Promise<FollowUser[]> {
  const response = await api.get<FollowUser[]>('/me/followers');
  return response;
}

/**
 * Send a follow request for the specified user; the backend will toggle the follow state.
 *
 * @param userId - ID of the user to follow or unfollow
 */
export async function followUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/follow`);
}

/**
 * Request that the current user unfollow the specified user.
 *
 * The server manages follow/unfollow as a toggle and will handle the state change.
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