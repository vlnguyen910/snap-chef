import axios from 'axios';

// BỎ DÒNG NÀY ĐI: export const IS_SUPABASE = ...

// Create axios instance for REST API
export const api = axios.create({
  // Đảm bảo biến môi trường này đã có trong file .env (trỏ về Render)
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Lưu ý: Kiểm tra xem bạn lưu là 'auth_token' hay 'accessToken' để sửa cho khớp
    const token = localStorage.getItem('accessToken'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data, // Trả về data luôn cho gọn
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Dùng window.location là cách an toàn nhất để reset app
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);