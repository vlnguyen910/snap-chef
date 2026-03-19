import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/axios";
import { uploadToCloudinary } from "@/services/cloudinaryService";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import FollowersFollowingModal from "@/components/common/FollowersFollowingModal";
import { Button } from "@/components/ui/button";

import type {
  UserProfileData,
  ProfileRecipe,
} from "@/features/users/types/profile";
import { ProfileHeader } from "@/features/users/components/profile/ProfileHeader";
import { ProfileStats } from "@/features/users/components/profile/ProfileStats";
import { ProfileRecipeList } from "@/features/users/components/profile/ProfileRecipeList";
import { EditProfileModal } from "@/features/users/components/profile/EditProfileModal";

export default function UserProfile() {
  const { id: userIdFromUrl } = useParams<{ id: string }>();
  const currentUser = useStore((state) => state.user);

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", bio: "" });

  const [isFollowing, setIsFollowing] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<
    "followers" | "following"
  >("followers");

  const [activeTab, setActiveTab] = useState<"created" | "liked">("created");
  const [userRecipes, setUserRecipes] = useState<ProfileRecipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<ProfileRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUser = useStore((state) => state.updateUser);

  const isOwnProfile = !userIdFromUrl || currentUser?.id === userIdFromUrl;

  useDocumentTitle(
    userData?.username ? `${userData.username}'s Profile` : "Profile",
  );

  useEffect(() => {
    fetchUserProfile();
    fetchUserRecipes();
  }, [userIdFromUrl]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (userIdFromUrl) {
        const response = await api.get<any>(`/users/${userIdFromUrl}/profile`);
        setUserData(response.user);
        setIsFollowing(response.is_followed || false);
      } else {
        const response = await api.get<UserProfileData>("/users/me");
        setUserData(response);
        setIsFollowing(false);

        if (response.avatar_url) {
          updateUser({ avatar: response.avatar_url });
        }
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      setError(
        err?.response?.data?.message || "Không thể tải thông tin người dùng",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const targetUserId = userIdFromUrl || currentUser?.id;
      if (!targetUserId) return;

      const createdRecipes = await api.get<ProfileRecipe[]>(
        `/recipes/user/${targetUserId}`,
      );
      setUserRecipes(Array.isArray(createdRecipes) ? createdRecipes : []);

      if (!userIdFromUrl && currentUser) {
        const liked = await api.get<any[]>("/users/me/likes");
        const likedRecipesList = liked
          .map((item: any) => item.recipe)
          .filter(Boolean);
        setLikedRecipes(likedRecipesList);
      }
    } catch (err: any) {
      console.error("Error fetching recipes:", err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      setIsUploadingAvatar(true);
      const avatarUrl = await uploadToCloudinary(file);

      if (userData) {
        await api.put(`/users/${userData.id}`, { avatar_url: avatarUrl });
        setUserData({ ...userData, avatar_url: avatarUrl });
        updateUser({ avatar: avatarUrl });
        toast.success("Cập nhật ảnh đại diện thành công!");
      }
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      toast.error(err?.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditClick = () => {
    if (userData) {
      setEditForm({ username: userData.username, bio: userData.bio || "" });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData) return;
    if (!editForm.username.trim()) {
      toast.error("Tên người dùng không được để trống");
      return;
    }

    try {
      setIsUpdating(true);
      await api.put(`/users/${userData.id}`, {
        username: editForm.username.trim(),
        bio: editForm.bio.trim() || null,
      });

      setUserData({
        ...userData,
        username: editForm.username.trim(),
        bio: editForm.bio.trim() || undefined,
      });

      updateUser({
        username: editForm.username.trim(),
        bio: editForm.bio.trim() || undefined,
      });

      toast.success("Cập nhật hồ sơ thành công!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không thể cập nhật hồ sơ. Vui lòng thử lại.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const updateFollowerCount = (followed: boolean) => {
    if (userData) {
      setUserData({
        ...userData,
        followers_count: followed
          ? (userData.followers_count || 0) + 1
          : (userData.followers_count || 1) - 1,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold">{error}</div>
          <Button onClick={fetchUserProfile} className="mt-4">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">
          Không tìm thấy thông tin người dùng
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-3xl border-0">
        <ProfileHeader
          userData={userData}
          isOwnProfile={isOwnProfile}
          avatarPreview={avatarPreview}
          isUploadingAvatar={isUploadingAvatar}
          isFollowing={isFollowing}
          handleAvatarClick={handleAvatarClick}
          handleAvatarChange={handleAvatarChange}
          handleEditClick={handleEditClick}
          setIsFollowing={setIsFollowing}
          updateFollowerCount={updateFollowerCount}
          fileInputRef={fileInputRef}
        />

        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editForm={editForm}
          setEditForm={setEditForm}
          handleUpdateProfile={handleUpdateProfile}
          isUpdating={isUpdating}
        />

        <ProfileStats
          userData={userData}
          onFollowersClick={() => {
            setFollowModalTab("followers");
            setFollowModalOpen(true);
          }}
          onFollowingClick={() => {
            setFollowModalTab("following");
            setFollowModalOpen(true);
          }}
        />

        <ProfileRecipeList
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loadingRecipes={loadingRecipes}
          userRecipes={userRecipes}
          likedRecipes={likedRecipes}
          isOwnProfile={isOwnProfile}
        />

        {followModalOpen && userData && (
          <FollowersFollowingModal
            userId={userIdFromUrl || currentUser?.id || ""}
            initialTab={followModalTab}
            onClose={() => setFollowModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
