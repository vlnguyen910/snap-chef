import AppRoutes from './routes/AppRoutes';
import { Toaster } from '@/components/ui/toaster'; // Hoặc thư viện toast bạn dùng (VD: sonner)
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <AppRoutes />
      <Toaster /> {/* Để hiển thị thông báo popup */}
    </TooltipProvider>
  );
}