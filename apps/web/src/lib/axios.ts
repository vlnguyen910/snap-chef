import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';

// 1. Lấy URL từ biến môi trường (Đã chuẩn)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 2. NÂNG CẤP: Trả về data trực tiếp để code gọn hơn
    // Thay vì response.data ở mọi nơi, ta trả về luôn cục data
    return response.data; 
  },
  (error: AxiosError) => {
    // Xử lý 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Lưu ý: Dùng window.location sẽ reload trang. Chấp nhận được ở mức cơ bản.
      window.location.href = '/auth/signin';
    }
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 3. Helper function để tạo Mock Config nhanh
// Giúp bạn gọi api.get('/url', useMock('Dynamic'))
export const useMock = (mockName: string): AxiosRequestConfig => ({
  headers: {
    'x-mock-response-name': mockName
  }
});

export const api = {
  // Lưu ý: Return type bây giờ là Promise<T> thay vì AxiosResponse<T>
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.get(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.post(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.put(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.patch(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.delete(url, config),
};

export default apiClient;