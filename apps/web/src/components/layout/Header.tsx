import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 1. TỐI ƯU ZUSTAND: Chọn lọc state cần thiết
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  // Kiểm tra xem user có tồn tại không để xác định đã login
  const isAuthenticated = !!user; 

  // 2. LOGIC ACTIVE LINK (Đã sửa lỗi chọn nhầm Home)
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout(); 
    setIsOpen(false);
    navigate('/auth/login'); // Chuyển trang sau khi logout
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-orange-600 transition-colors hover:text-orange-700">
            <span className="text-3xl">🍳</span>
            Snap Chef
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden gap-1 md:flex">
            <Button variant={isActive('/') ? 'secondary' : 'ghost'} asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant={isActive('/recipes') ? 'secondary' : 'ghost'} asChild>
              <Link to="/recipes">Recipes</Link>
            </Button>
            
            {isAuthenticated && (
              <>
                <Button variant={isActive('/dashboard') ? 'secondary' : 'ghost'} asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant={isActive('/my-recipes') ? 'secondary' : 'ghost'} asChild>
                  <Link to="/my-recipes">My Recipes</Link>
                </Button>
                
                {/* Optional chaining (?.) để tránh lỗi nếu user null */}
                {user?.role === 'moderator' && (
                  <Button variant={isActive('/moderation') ? 'secondary' : 'ghost'} asChild>
                    <Link to="/moderation">Moderation</Link>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <UserIcon size={18} />
                    {/* Fallback hiển thị email nếu không có username */}
                    <span className="max-w-[150px] truncate">{user.username || user.email}</span>
                  </Link>
                </Button>
                <Button variant="default" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut size={18} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link to="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Navigation (Giữ nguyên logic đóng mở của bạn) */}
        {isOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden">
             {/* ... Copy phần nội dung mobile menu cũ vào đây ... */}
             {/* Nhớ cập nhật các hàm onClick gọi handleLogout nhé */}
          </div>
        )}
      </div>
    </nav>
  );
}