import { Outlet } from 'react-router-dom';
import Header from './Header';
import SidebarComponent from './Sidebar';

interface MainLayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
}

export default function MainLayout({ children, showSidebar = false }: MainLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <Header />
      <main className="flex flex-1 h-full overflow-hidden">
        {showSidebar && <SidebarComponent />}
        <div className="flex-1 h-full overflow-y-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
