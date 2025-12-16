import LoginForm from '@/features/auth/components/LoginForm';
import RegisterForm from '@/features/auth/components/RegisterForm';
import { useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react'; // Thêm hook này

export default function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname.includes('register'); // Đặt biến boolean cho dễ đọc

  // Nâng cấp: Đổi Title trình duyệt khi chuyển trang
  useEffect(() => {
    document.title = isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập';
  }, [isRegister]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
          {/* Render có điều kiện */}
          {isRegister ? <RegisterForm /> : <LoginForm />}
        </div>
      </div>
    </div>
  );
}