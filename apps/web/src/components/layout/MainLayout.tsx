import { Outlet } from 'react-router-dom';
import Header from './Header';
import SidebarComponent from './Sidebar';

interface MainLayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
}

export default function MainLayout({ children, showSidebar = false }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1">
        {showSidebar && <SidebarComponent />}
        <div className="flex-1">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
