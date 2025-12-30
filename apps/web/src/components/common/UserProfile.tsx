import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Edit, Camera, Loader2, X, UserPlus, UserCheck, Heart } from 'lucide-react';
import { api } from '@/lib/axios';
import { maskEmail } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { uploadToCloudinary } from '@/services/cloudinaryService';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { useMutation } from '@tanstack/react-query';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  recipes_count?: number;
  is_followed?: boolean;
}

interface Recipe {
  id: string;
  title: string;
  thumbnail_url?: string;
  likes_count: number;
}

export default function UserProfile() {
  const { id: userIdFromUrl } = useParams<{ id: string }>();
  const currentUser = useStore((state) => state.user);
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'created' | 'liked'>('created');
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUser = useStore((state) => state.updateUser);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userIdFromUrl;

  // Update document title dynamically
  useDocumentTitle(userData?.username ? `${userData.username}'s Profile` : 'Profile');

  useEffect(() => {
    fetchUserProfile();
    fetchUserRecipes();
  }, [userIdFromUrl]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (userIdFromUrl) {
        // Viewing another user's profile - use /profile endpoint to get follow status
        const response = await api.get<any>(`/users/${userIdFromUrl}/profile`);
        // Backend returns { user: {...}, is_followed: boolean }
        setUserData(response.user);
        setIsFollowing(response.is_followed || false);
      } else {
        // Viewing own profile - use /me endpoint
        const response = await api.get<UserProfileData>('/users/me');
        setUserData(response);
        setIsFollowing(false);
        
        // Sync avatar to global store
        if (response.avatar_url) {
          updateUser({ avatar: response.avatar_url });
        }
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err?.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const targetUserId = userIdFromUrl || currentUser?.id;
      if (!targetUserId) return;

      // Fetch created recipes
      const createdRecipes = await api.get<Recipe[]>(`/recipes/user/${targetUserId}`);
      setUserRecipes(Array.isArray(createdRecipes) ? createdRecipes : []);

      // Fetch liked recipes if viewing own profile
      if (!userIdFromUrl && currentUser) {
        const liked = await api.get<any[]>('/users/me/likes');
        const likedRecipesList = liked.map((item: any) => item.recipe).filter(Boolean);
        setLikedRecipes(likedRecipesList);
      }
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      // Don't show error, just leave empty arrays
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (isFollowing) {
        await api.delete(`/users/${userId}/follow`);
      } else {
        await api.post(`/users/${userId}/follow`);
      }
    },
    onSuccess: async () => {
      // Refetch profile to update follower count and follow status from backend
      await fetchUserProfile();
      toast.success(isFollowing ? 'Đã bỏ theo dõi' : 'Đã theo dõi');
    },
    onError: (error: any) => {
      console.error('Follow error:', error);
      toast.error(error?.response?.data?.message || 'Không thể thực hiện');
    },
  });

  const handleFollowToggle = () => {
    // Check if user is logged in
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để theo dõi người dùng');
      navigate('/auth/signin');
      return;
    }

    if (!userData?.id) {
      toast.error('Không thể thực hiện');
      return;
    }

    followMutation.mutate(userData.id);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      
      // Upload to Cloudinary
      const avatarUrl = await uploadToCloudinary(file);
      
      // Update user profile with new avatar URL
      if (userData) {
        await api.put(`/users/${userData.id}`, {
          avatar_url: avatarUrl,
        });

        // Update local state
        setUserData({
          ...userData,
          avatar_url: avatarUrl,
        });

        // Update global store for header
        updateUser({ avatar: avatarUrl });

        toast.success('Cập nhật ảnh đại diện thành công!');
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      toast.error(err?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditClick = () => {
    if (userData) {
      setEditForm({
        username: userData.username,
        bio: userData.bio || '',
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData) return;

    // Validation
    if (!editForm.username.trim()) {
      toast.error('Tên người dùng không được để trống');
      return;
    }

    try {
      setIsUpdating(true);
      
      await api.put(`/users/${userData.id}`, {
        username: editForm.username.trim(),
        bio: editForm.bio.trim() || null,
      });

      // Update local state
      setUserData({
        ...userData,
        username: editForm.username.trim(),
        bio: editForm.bio.trim() || undefined,
      });

      // Update global store for header
      updateUser({ 
        username: editForm.username.trim(),
        bio: editForm.bio.trim() || undefined,
      });

      toast.success('Cập nhật hồ sơ thành công!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err?.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
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
        <div className="text-gray-600 dark:text-gray-400">Không tìm thấy thông tin người dùng</div>
      </div>
    );
  }

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (userData.username) {
      return userData.username.substring(0, 2).toUpperCase();
    }
    if (userData.email) {
      return userData.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-3xl">
        {/* Profile Card */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden transform transition-all hover:shadow-3xl">
          {/* Header Background with Pattern */}
          <div className="h-40 bg-gradient-to-br from-orange-500 via-orange-600 to-pink-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5 backdrop-blur-sm"></div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="relative px-8 pb-10">
            {/* Avatar */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2">
              <div className="relative group">
                {userData.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.username}
                    className="h-40 w-40 rounded-full border-8 border-white dark:border-gray-800 object-cover shadow-2xl ring-4 ring-orange-100 dark:ring-orange-900"
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-full border-8 border-white dark:border-gray-800 bg-gradient-to-br from-orange-500 to-pink-500 text-5xl font-bold text-white shadow-2xl ring-4 ring-orange-100 dark:ring-orange-900">
                    {getInitials()}
                  </div>
                )}
                
                {/* Upload Button Overlay - Only show for own profile */}
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
                    
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="mt-24 text-center">
              {/* Username */}
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {userData.username}
              </h1>

              {/* Contact Information */}
              <div className="mt-8 space-y-5">
                {/* Email */}
                <div className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-base font-medium">{maskEmail(userData.email)}</span>
                </div>

                {/* Bio */}
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

              {/* Action Buttons */}
              <div className="mt-8 flex justify-center gap-3">
                {/* Edit Profile Button - Only show for own profile */}
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
                  /* Follow Button - Only show for other users' profiles */
                  userData && currentUser?.id !== userData.id && (
                    <Button
                      size="lg"
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending}
                      className={`flex items-center gap-2 px-8 ${
                        isFollowing
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                    >
                      {followMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="h-5 w-5" />
                          Đang theo dõi
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          Theo dõi
                        </>
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white ">Chỉnh sửa hồ sơ</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên người dùng
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nhập tên người dùng"
                  />
                </div>

                {/* Bio Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Viết vài dòng về bản thân bạn..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats or Info Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 shadow-lg border border-orange-200 dark:border-orange-800 text-center transform transition-all hover:scale-105">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
              {userData.recipes_count || 0}
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">Công thức</div>
          </div>
          <button 
            onClick={() => navigate(`/users/${userIdFromUrl || currentUser?.id}/followers`)}
            className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 shadow-lg border border-blue-200 dark:border-blue-800 text-center hover:scale-105 transform transition-all cursor-pointer"
          >
            <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {userData.followers_count || 0}
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">Người theo dõi</div>
          </button>
          <button 
            onClick={() => navigate(`/users/${userIdFromUrl || currentUser?.id}/following`)}
            className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 shadow-lg border border-purple-200 dark:border-purple-800 text-center hover:scale-105 transform transition-all cursor-pointer"
          >
            <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              {userData.following_count || 0}
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">Đang theo dõi</div>
          </button>
        </div>

        {/* Recipe Showcase Section */}
        <div className="mt-12">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('created')}
              className={`pb-3 px-6 text-base font-semibold transition-all relative ${
                activeTab === 'created'
                  ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
              }`}
            >
              Công thức đã tạo
            </button>
            {!userIdFromUrl && (
              <button
                onClick={() => setActiveTab('liked')}
                className={`pb-3 px-6 text-base font-semibold transition-all relative ${
                  activeTab === 'liked'
                    ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
                }`}
              >
                Công thức đã thích
              </button>
            )}
          </div>

          {/* Recipe Grid */}
          {loadingRecipes ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(activeTab === 'created' ? userRecipes : likedRecipes).length > 0 ? (
                (activeTab === 'created' ? userRecipes : likedRecipes).map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                    className="group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800"
                  >
                    {/* Recipe Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={recipe.thumbnail_url || 'https://via.placeholder.com/400x300'}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      
                      {/* Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
                          {recipe.title}
                        </h3>
                      </div>
                    </div>

                    {/* Heart Count */}
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                        <span className="text-sm font-semibold">
                          {recipe.likes_count || 0} lượt thích
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-16">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {activeTab === 'created'
                      ? 'Chưa có công thức nào'
                      : 'Chưa có công thức yêu thích'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
