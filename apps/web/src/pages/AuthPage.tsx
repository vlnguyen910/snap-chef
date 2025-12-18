import LoginForm from '@/features/auth/components/LoginForm';
import RegisterForm from '@/features/auth/components/RegisterForm';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react'; // Thêm hook này

export default function AuthPage() {
  const location = useLocation();
  const isSignup = location.pathname.includes('signup'); // Check for signup route

  // Update browser title when page changes
  useEffect(() => {
    document.title = isSignup ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập';
  }, [isSignup]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
          {/* Conditional render based on route */}
          {isSignup ? <RegisterForm /> : <LoginForm />}
        </div>
      </div>
    </div>
  );
}