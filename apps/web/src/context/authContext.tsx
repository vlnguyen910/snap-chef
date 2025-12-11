import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/axios';

// QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP CHO WEB

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Khi App vừa chạy, kiểm tra xem có Token cũ không
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Ở dự án thật: Gọi API /me để lấy info user từ token
      // Ở đây (Mock): Mình giả bộ set user luôn để UI hiển thị
      setUser({ id: '1', name: 'User Test', email: 'test@example.com' });
    }
    setIsLoading(false);
  }, []);

  // 2. Hàm Login
  const login = async (email: string, pass: string) => {
    try {
      // Gọi API Login (Mock)
      const res: any = await api.post('/auth/login', { email, pass });
      
      // Lưu token và User Info
      if (res.accessToken) {
        localStorage.setItem('authToken', res.accessToken);
        // Cập nhật State -> Header sẽ tự đổi ngay lập tức
        setUser(res.user || { id: '99', name: 'Raven', email: email }); 
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // 3. Hàm Logout
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null); // Xóa state -> Header tự đổi lại thành nút Login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để dùng ở các component khác
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};