import React from "react";
import { User, Mail, Edit, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maskEmail } from "@/lib/utils";
import FollowButton from "@/components/common/FollowButton";
import type { UserProfileData } from "../../types/profile";

interface ProfileHeaderProps {
  userData: UserProfileData;
  isOwnProfile: boolean;
  avatarPreview: string | null;
  isUploadingAvatar: boolean;
  isFollowing: boolean;
  handleAvatarClick: () => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditClick: () => void;
  setIsFollowing: (followed: boolean) => void;
  updateFollowerCount: (isFollowing: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProfileHeader({
  userData,
  isOwnProfile,
  avatarPreview,
  isUploadingAvatar,
  isFollowing,
  handleAvatarClick,
  handleAvatarChange,
  handleEditClick,
  setIsFollowing,
  updateFollowerCount,
  fileInputRef,
}: ProfileHeaderProps) {
  const getInitials = () => {
    if (userData.username) {
      return userData.username.substring(0, 2).toUpperCase();
    }
    if (userData.email) {
      return userData.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl">
      <div className="h-40 bg-gradient-to-br from-orange-500 via-orange-600 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 backdrop-blur-sm"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="relative px-8 pb-10">
        <div className="flex flex-col items-center pt-4">
          <div className="relative group -mt-24 mb-6">
            {avatarPreview || userData.avatar_url ? (
              <img
                src={avatarPreview || userData.avatar_url}
                alt={userData.username}
                className="h-40 w-40 rounded-full border-8 border-white dark:border-gray-800 object-cover shadow-2xl ring-4 ring-orange-100 dark:ring-orange-900"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-white dark:border-gray-800 bg-gradient-to-br from-orange-500 to-pink-500 text-5xl font-bold text-white shadow-2xl ring-4 ring-orange-100 dark:ring-orange-900">
                {getInitials()}
              </div>
            )}

            {isOwnProfile && (
              <>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 group-hover:bg-opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </>
            )}

            {isOwnProfile && (
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-2 right-2 p-3 bg-orange-500 hover:bg-orange-600 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Thay đổi ảnh đại diện"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
            )}
          </div>

          <div className="text-center w-full">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {userData.username}
            </h1>

            <div className="mt-8 space-y-5">
              <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-base font-medium">
                  {maskEmail(userData.email)}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                {userData.bio ? (
                  <span className="text-base max-w-md">{userData.bio}</span>
                ) : (
                  <span className="text-base italic text-gray-400 dark:text-gray-500">
                    Thêm bio của bạn
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              {isOwnProfile ? (
                <Button
                  size="lg"
                  className="flex items-center gap-2 px-8"
                  onClick={handleEditClick}
                >
                  <Edit className="h-5 w-5" />
                  Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <FollowButton
                  userId={userData.id}
                  initialIsFollowed={isFollowing}
                  onFollowChange={(followed) => {
                    setIsFollowing(followed);
                    updateFollowerCount(followed);
                  }}
                  size="lg"
                  className="px-8"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
