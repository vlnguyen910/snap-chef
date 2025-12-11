import AppRoutes from './routes/AppRoutes';
import { Toaster } from '@/components/ui/toaster'; // Hoặc thư viện toast bạn dùng (VD: sonner)

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster /> {/* Để hiển thị thông báo popup */}
    </>
  );
}