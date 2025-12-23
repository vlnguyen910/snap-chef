import { useEffect, useState } from 'react';
import { User, Mail, Phone, Edit } from 'lucide-react';
import { api } from '@/lib/axios';
import { maskEmail } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  role?: string;
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<UserProfileData>('/users/me');
      setUserData(response);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err?.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
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
            </div>

            {/* Profile Details */}
            <div className="mt-20 text-center">
              {/* Username */}
              <h1 className="text-3xl font-bold text-gray-900">
                {userData.username}
              </h1>

              {/* Bio (if available) */}
              {userData.bio && (
                <p className="mt-2 text-gray-600">{userData.bio}</p>
              )}

              {/* Contact Information */}
              <div className="mt-6 space-y-4">
                {/* Email */}
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <span className="text-lg">{maskEmail(userData.email)}</span>
                </div>

                {/* Phone */}
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <Phone className="h-5 w-5 text-orange-500" />
                  {userData.phone ? (
                    <span className="text-lg">{userData.phone}</span>
                  ) : (
                    <span className="text-lg italic text-gray-400">
                      Thêm số điện thoại
                    </span>
                  )}
                </div>
              </div>

              {/* Additional Info (if available) */}
              {(userData.firstName || userData.lastName) && (
                <div className="mt-4 text-gray-600">
                  <span className="text-sm">
                    {userData.firstName} {userData.lastName}
                  </span>
                </div>
              )}

              {/* Role Badge (if available) */}
              {userData.role && (
                <div className="mt-4">
                  <span className="inline-block rounded-full bg-orange-100 px-4 py-1 text-sm font-semibold text-orange-600">
                    {userData.role}
                  </span>
                </div>
              )}

              {/* Edit Profile Button */}
              <div className="mt-8">
                <Button
                  size="lg"
                  className="flex items-center gap-2 px-8"
                  onClick={() => {
                    // TODO: Implement edit profile logic
                    console.log('Edit profile clicked');
                  }}
                >
                  <Edit className="h-5 w-5" />
                  Chỉnh sửa hồ sơ
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats or Info Cards (Optional) */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow text-center">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-600">Công thức</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow text-center">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-600">Người theo dõi</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow text-center">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-600">Đang theo dõi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
