import { useState, useEffect, useRef } from 'react';
import { X, Users, UserCheck, Loader2 } from 'lucide-react';
import { getUserFollowers, getUserFollowing, followUser, unfollowUser } from '@/services/userService';
import type { UserSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';

interface FollowersFollowingModalProps {
  userId: string;
  initialTab?: 'followers' | 'following';
  onClose: () => void;
}

type TabType = 'followers' | 'following';

interface CachedData {
  followers: UserSummary[] | null;
  following: UserSummary[] | null;
}

interface PaginationState {
  followers: {
    page: number;
    hasMore: boolean;
    isLoadingMore: boolean;
  };
  following: {
    page: number;
    hasMore: boolean;
    isLoadingMore: boolean;
  };
}

const LIMIT = 15; // Items per page

export default function FollowersFollowingModal({
  userId,
  initialTab = 'followers',
  onClose,
}: FollowersFollowingModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [followers, setFollowers] = useState<UserSummary[]>([]);
  const [following, setFollowing] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<PaginationState>({
    followers: { page: 1, hasMore: true, isLoadingMore: false },
    following: { page: 1, hasMore: true, isLoadingMore: false },
  });

  // Cache ref to store data and avoid re-fetching
  const cacheRef = useRef<CachedData>({
    followers: null,
    following: null,
  });

  const listContainerRef = useRef<HTMLDivElement>(null);
  
  // Loading ref to prevent duplicate requests (immediate, not state-dependent)
  const isLoadingRef = useRef(false);
  
  // Debounce ref for scroll events
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]); // Only load when userId changes, not activeTab

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    // ✅ AUTH GUARD: Prevent API calls if user is not authenticated
    if (!user || !user.id) {
      console.warn('⚠️ User not authenticated - skipping followers/following fetch');
      setError('Please log in to view this information');
      setIsLoading(false);
      return;
    }

    const tabToLoad: TabType = activeTab;
    const isCached = tabToLoad === 'followers' ? cacheRef.current.followers !== null : cacheRef.current.following !== null;

    // Only show loading if we're fetching new data (not cached)
    if (!isCached) {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      // Load followers if not cached
      if (cacheRef.current.followers === null) {
        const followersData = await fetchFollowers(1);
        cacheRef.current.followers = followersData;
        setFollowers(followersData);
        setPagination((prev) => ({
          ...prev,
          followers: {
            page: 2,
            hasMore: followersData.length >= LIMIT,
            isLoadingMore: false,
          },
        }));
      } else {
        setFollowers(cacheRef.current.followers);
      }

      // Load following if not cached
      if (cacheRef.current.following === null) {
        const followingData = await fetchFollowing(1);
        cacheRef.current.following = followingData;
        setFollowing(followingData);
        setPagination((prev) => ({
          ...prev,
          following: {
            page: 2,
            hasMore: followingData.length >= LIMIT,
            isLoadingMore: false,
          },
        }));
      } else {
        setFollowing(cacheRef.current.following);
      }
    } catch (err: any) {
      console.error('Error loading user network:', err);
      if (err.response?.status === 404) {
        setError('User not found');
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async (page: number) => {
    const response = await getUserFollowers(userId, page, LIMIT);
    return Array.isArray(response) ? response : [];
  };

  const fetchFollowing = async (page: number) => {
    const response = await getUserFollowing(userId, page, LIMIT);
    return Array.isArray(response) ? response : [];
  };

  // Handle tab switching with cached data
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // If switching to a cached tab, show data immediately
    const isCached = tab === 'followers' ? cacheRef.current.followers !== null : cacheRef.current.following !== null;
    
    if (isCached) {
      const data = tab === 'followers' ? cacheRef.current.followers : cacheRef.current.following;
      if (data) {
        if (tab === 'followers') {
          setFollowers(data);
        } else {
          setFollowing(data);
        }
      }
    } else {
      // If not cached, fetch the data
      setIsLoading(true);
      setError(null);
      
      (tab === 'followers' ? fetchFollowers(1) : fetchFollowing(1))
        .then((data) => {
          if (tab === 'followers') {
            cacheRef.current.followers = data;
            setFollowers(data);
            setPagination((prev) => ({
              ...prev,
              followers: {
                page: 2,
                hasMore: data.length >= LIMIT,
                isLoadingMore: false,
              },
            }));
          } else {
            cacheRef.current.following = data;
            setFollowing(data);
            setPagination((prev) => ({
              ...prev,
              following: {
                page: 2,
                hasMore: data.length >= LIMIT,
                isLoadingMore: false,
              },
            }));
          }
        })
        .catch((err: any) => {
          console.error('Error loading user network:', err);
          if (err.response?.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load users. Please try again.');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  // Handle infinite scroll with debouncing and loading guard
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;

    if (!isNearBottom) return;

    // Guard 1: Check if already loading (using ref for immediate feedback)
    if (isLoadingRef.current) {
      return;
    }

    // Guard 2: Check pagination state
    const currentPagination = pagination[activeTab];
    if (!currentPagination.hasMore) {
      return;
    }

    // Guard 3: Debounce scroll events (wait 100ms before allowing another fetch)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(async () => {
      // Final check before fetching
      if (isLoadingRef.current || !pagination[activeTab].hasMore) {
        return;
      }

      // Set loading flag immediately (prevents duplicate requests)
      isLoadingRef.current = true;

      // Update state for UI
      setPagination((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], isLoadingMore: true },
      }));

      try {
        const nextPage = pagination[activeTab].page;
        const newData = activeTab === 'followers'
          ? await fetchFollowers(nextPage)
          : await fetchFollowing(nextPage);

        if (newData.length === 0) {
          // No more data to fetch
          setPagination((prev) => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], hasMore: false, isLoadingMore: false },
          }));
          return;
        }

        // Append new data to existing list
        if (activeTab === 'followers') {
          const updated = [...followers, ...newData];
          setFollowers(updated);
          cacheRef.current.followers = updated;
        } else {
          const updated = [...following, ...newData];
          setFollowing(updated);
          cacheRef.current.following = updated;
        }

        // Update pagination
        setPagination((prev) => ({
          ...prev,
          [activeTab]: {
            page: nextPage + 1,
            hasMore: newData.length >= LIMIT,
            isLoadingMore: false,
          },
        }));
      } catch (err) {
        console.error('Error loading more users:', err);
        setPagination((prev) => ({
          ...prev,
          [activeTab]: { ...prev[activeTab], isLoadingMore: false },
        }));
      } finally {
        // Clear loading flag
        isLoadingRef.current = false;
      }
    }, 100); // 100ms debounce
  };

  const handleFollowToggle = async (targetUserId: string, currentlyFollowed: boolean) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/signin';
      return;
    }

    // Optimistic UI update
    setFollowingInProgress((prev) => new Set(prev).add(targetUserId));

    const updateUserList = (users: UserSummary[]) =>
      users.map((u) =>
        u.id === targetUserId ? { ...u, is_followed: !currentlyFollowed } : u
      );

    // Update local state and cache optimistically
    if (activeTab === 'followers') {
      const updated = updateUserList(followers);
      setFollowers(updated);
      cacheRef.current.followers = updated;
    } else {
      const updated = updateUserList(following);
      setFollowing(updated);
      cacheRef.current.following = updated;
    }

    try {
      if (currentlyFollowed) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert optimistic update on error
      if (activeTab === 'followers') {
        const reverted = updateUserList(followers);
        setFollowers(reverted);
        cacheRef.current.followers = reverted;
      } else {
        const reverted = updateUserList(following);
        setFollowing(reverted);
        cacheRef.current.following = reverted;
      }
    } finally {
      setFollowingInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const currentUsers = activeTab === 'followers' ? followers : following;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleTabChange('followers')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="inline-block h-4 w-4 mr-2" />
            Followers ({followers.length})
          </button>
          <button
            onClick={() => handleTabChange('following')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UserCheck className="inline-block h-4 w-4 mr-2" />
            Following ({following.length})
          </button>
        </div>

        {/* Content */}
        <div 
          ref={listContainerRef}
          className="flex-1 overflow-y-auto p-4 max-h-[60vh]"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : error ? (
            <ErrorState message={error} />
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {currentUsers.map((targetUser) => (
                  <div
                    key={targetUser.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Link
                      to={`/profile/${targetUser.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={onClose}
                    >
                      <img
                        src={targetUser.avatar_url || '/default-avatar.png'}
                        alt={targetUser.username}
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {targetUser.username}
                        </p>
                      </div>
                    </Link>

                    {/* Follow Button - only show if is_followed is defined and not viewing own profile */}
                    {user && user.id !== targetUser.id && targetUser.is_followed !== undefined && (
                      <Button
                        size="sm"
                        variant={targetUser.is_followed ? 'outline' : 'default'}
                        onClick={() =>
                          handleFollowToggle(targetUser.id, targetUser.is_followed!)
                        }
                        disabled={followingInProgress.has(targetUser.id)}
                        className="ml-3 flex-shrink-0"
                      >
                        {followingInProgress.has(targetUser.id)
                          ? 'Loading...'
                          : targetUser.is_followed
                          ? 'Unfollow'
                          : 'Follow'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Load More Spinner */}
              {pagination[activeTab].isLoadingMore && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 text-orange-500 animate-spin mr-2" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Loading more...</span>
                </div>
              )}

              {/* End of List Message */}
              {!pagination[activeTab].hasMore && currentUsers.length > 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    No more users to load
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
