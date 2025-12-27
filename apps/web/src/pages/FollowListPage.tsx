import { useState } from 'react';
import { Users, UserCheck, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { useFollowing, useFollowers, useToggleFollow } from '@/hooks/useUser';
import { Link, useNavigate } from 'react-router-dom';
import type { FollowUser } from '@/types';

type TabType = 'following' | 'followers';

export default function FollowListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('following');

  const { data: followingList = [], isLoading: followingLoading, error: followingError } = useFollowing();
  const { data: followersList = [], isLoading: followersLoading, error: followersError } = useFollowers();
  const { toggleFollow, isLoading: toggleLoading } = useToggleFollow();

  const isLoading = activeTab === 'following' ? followingLoading : followersLoading;
  const error = activeTab === 'following' ? followingError : followersError;
  const currentList = activeTab === 'following' ? followingList : followersList;

  const handleUnfollow = (userId: string) => {
    toggleFollow(userId, true); // true means currently following, so unfollow
  };

  const handleFollow = (userId: string) => {
    toggleFollow(userId, false); // false means not following, so follow
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
          </div>
          <p className="text-gray-600 mt-2">Manage your followers and following</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'following'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Following ({followingList.length})
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'followers'
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Followers ({followersList.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load {activeTab}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Try again
                </button>
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {activeTab === 'following' 
                    ? "You're not following anyone yet" 
                    : "You don't have any followers yet"}
                </p>
                <p className="text-gray-400 text-sm">
                  {activeTab === 'following'
                    ? 'Start following users to see their recipes'
                    : 'Share your recipes to gain followers'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentList.map((user: FollowUser) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isFollowing={activeTab === 'following'}
                    onFollow={() => handleFollow(user.id)}
                    onUnfollow={() => handleUnfollow(user.id)}
                    isLoading={toggleLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// User Card Component
interface UserCardProps {
  user: FollowUser;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  isLoading: boolean;
}

function UserCard({ user, isFollowing, onFollow, onUnfollow, isLoading }: UserCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
      {/* Avatar */}
      <Link to={`/profile/${user.id}`}>
        <img
          src={user.avatar_url || '/default-avatar.png'}
          alt={user.username}
          className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
        />
      </Link>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <Link 
          to={`/profile/${user.id}`}
          className="font-medium text-gray-900 hover:text-orange-600 transition-colors block truncate"
        >
          {user.username}
        </Link>
        {user.bio && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{user.bio}</p>
        )}
      </div>

      {/* Action Button */}
      {isFollowing ? (
        <button
          onClick={onUnfollow}
          disabled={isLoading}
          className="px-5 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <UserCheck className="h-4 w-4" />
          Following
        </button>
      ) : (
        <button
          onClick={onFollow}
          disabled={isLoading}
          className="px-5 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Follow Back
        </button>
      )}
    </div>
  );
}
