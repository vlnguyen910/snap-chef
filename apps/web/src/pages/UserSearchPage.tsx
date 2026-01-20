import { useState, useEffect } from 'react';
import { Search, Users, UserPlus, UserMinus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchUsers, followUser, unfollowUser } from '@/services/userService';
import type { SearchUserResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';

export default function UserSearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    // Reset when search query changes
    setPage(1);
    setUsers([]);
    setHasMore(true);
    if (debouncedSearchQuery) {
      performSearch(1);
    }
  }, [debouncedSearchQuery]);

  const performSearch = async (pageNum: number) => {
    if (!debouncedSearchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchUsers({
        q: debouncedSearchQuery,
        page: pageNum,
        limit: 20,
      });

      if (pageNum === 1) {
        setUsers(results);
      } else {
        setUsers((prev) => [...prev, ...results]);
      }

      // Check if there are more results
      setHasMore(results.length === 20);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(nextPage);
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/signin';
      return;
    }

    const isCurrentlyFollowed = followedUsers.has(targetUserId);

    // Optimistic UI update
    setFollowingInProgress((prev) => new Set(prev).add(targetUserId));
    setFollowedUsers((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyFollowed) {
        newSet.delete(targetUserId);
      } else {
        newSet.add(targetUserId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyFollowed) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert optimistic update on error
      setFollowedUsers((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowed) {
          newSet.add(targetUserId);
        } else {
          newSet.delete(targetUserId);
        }
        return newSet;
      });
    } finally {
      setFollowingInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and connect with other chefs in the community
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Results */}
        {!debouncedSearchQuery ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Start typing to search for users
            </p>
          </div>
        ) : isLoading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loading />
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No users found matching "{debouncedSearchQuery}"
            </p>
          </div>
        ) : (
          <>
            {/* User Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {users.map((targetUser) => (
                <div
                  key={targetUser.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <Link to={`/profile/${targetUser.id}`} className="flex-shrink-0">
                      <img
                        src={targetUser.avatar_url || '/default-avatar.png'}
                        alt={targetUser.username}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${targetUser.id}`}
                        className="block hover:text-orange-600 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {targetUser.username}
                        </h3>
                      </Link>
                      {targetUser.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {targetUser.email}
                        </p>
                      )}
                      {targetUser.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          {targetUser.bio}
                        </p>
                      )}

                      {/* Follow Button */}
                      {user && user.id !== targetUser.id && (
                        <Button
                          size="sm"
                          variant={followedUsers.has(targetUser.id) ? 'outline' : 'default'}
                          onClick={() => handleFollowToggle(targetUser.id)}
                          disabled={followingInProgress.has(targetUser.id)}
                          className="mt-3"
                        >
                          {followingInProgress.has(targetUser.id) ? (
                            'Loading...'
                          ) : followedUsers.has(targetUser.id) ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-1" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="min-w-[200px]"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
