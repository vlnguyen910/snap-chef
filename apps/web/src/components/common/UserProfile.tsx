import { useEffect, useState, useRef } from 'react';
import { User, Mail, Phone, Edit, Camera, Loader2, X } from 'lucide-react';
import { api } from '@/lib/axios';
import { maskEmail } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { uploadToCloudinary } from '@/services/cloudinaryService';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

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
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUser = useStore((state) => state.updateUser);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<UserProfileData>('/users/me');
      setUserData(response);
      
      // Sync avatar to global store for header
      if (response.avatar_url) {
        updateUser({ avatar: response.avatar_url });
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err?.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
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
          <p className="mt-4 text-gray-600">Đang tải...</p>
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
        <div className="text-gray-600">Không tìm thấy thông tin người dùng</div>
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Profile Card */}
        <div className="rounded-lg bg-white shadow-lg overflow-hidden">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600"></div>

          {/* Profile Content */}
          <div className="relative px-6 pb-8">
            {/* Avatar */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2">
              <div className="relative group">
                {userData.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.username}
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-orange-500 text-4xl font-bold text-white shadow-lg">
                    {getInitials()}
                  </div>
                )}
                
                {/* Upload Button Overlay */}
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
              </div>
            </div>

            {/* Profile Details */}
            <div className="mt-20 text-center">
              {/* Username */}
              <h1 className="text-3xl font-bold text-gray-900">
                {userData.username}
              </h1>

              {/* Contact Information */}
              <div className="mt-6 space-y-4">
                {/* Email */}
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <span className="text-lg">{maskEmail(userData.email)}</span>
                </div>

                {/* Bio */}
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <User className="h-5 w-5 text-orange-500" />
                  {userData.bio ? (
                    <span className="text-lg">{userData.bio}</span>
                  ) : (
                    <span className="text-lg italic text-gray-400">
                      Thêm bio của bạn
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Profile Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  className="flex items-center gap-2 px-8"
                  onClick={handleEditClick}
                >
                  <Edit className="h-5 w-5" />
                  Chỉnh sửa hồ sơ
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 ">Chỉnh sửa hồ sơ</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên người dùng
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập tên người dùng"
                  />
                </div>

                {/* Bio Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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

        {/* Additional Stats or Info Cards (Optional) */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow text-center">
            <div className="text-2xl font-bold text-orange-600">
              {userData.recipes_count || 0}
            </div>
            <div className="text-sm text-gray-600">Công thức</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow text-center">
            <div className="text-2xl font-bold text-orange-600">
              {userData.followers_count || 0}
            </div>
            <div className="text-sm text-gray-600">Người theo dõi</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow text-center">
            <div className="text-2xl font-bold text-orange-600">
              {userData.following_count || 0}
            </div>
            <div className="text-sm text-gray-600">Đang theo dõi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
