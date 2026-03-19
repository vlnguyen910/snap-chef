import type { UserProfileData } from "../../types/profile";

interface ProfileStatsProps {
  userData: UserProfileData;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}

export function ProfileStats({
  userData,
  onFollowersClick,
  onFollowingClick,
}: ProfileStatsProps) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
      <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 shadow-lg border border-orange-200 dark:border-orange-800 text-center transform transition-all hover:scale-105">
        <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
          {userData.recipes_count || 0}
        </div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
          Công thức
        </div>
      </div>
      <button
        onClick={onFollowersClick}
        className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 shadow-lg border border-blue-200 dark:border-blue-800 text-center hover:scale-105 transform transition-all cursor-pointer"
      >
        <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          {userData.followers_count || 0}
        </div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
          Người theo dõi
        </div>
      </button>
      <button
        onClick={onFollowingClick}
        className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 shadow-lg border border-purple-200 dark:border-purple-800 text-center hover:scale-105 transform transition-all cursor-pointer"
      >
        <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          {userData.following_count || 0}
        </div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
          Đang theo dõi
        </div>
      </button>
    </div>
  );
}
