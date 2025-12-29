import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ChefHat, 
  Heart, 
  User, 
  Settings,
  FileCheck,
  Users,
  BarChart3
} from 'lucide-react';
import { useStore } from '@/lib/store';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation();
  const { user } = useStore();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  // User menu items
  const userMenuItems = [
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/my-recipes', label: 'My Recipes', icon: ChefHat },
    { path: '/favorites', label: 'Favorites', icon: Heart },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // Moderator menu items
  const moderatorMenuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/queue', label: 'Approval Queue', icon: FileCheck },
    { path: '/admin/content', label: 'Content Manager', icon: ChefHat },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const menuItems = user?.role === 'moderator' ? moderatorMenuItems : userMenuItems;

  return (
    <aside className={`hidden w-64 border-r border-gray-200 bg-white md:block h-full ${className}`}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center gap-2 text-lg font-bold text-orange-600">
            <ChefHat size={24} />
            <span>{user?.role === 'moderator' ? 'Admin Panel' : 'My Kitchen'}</span>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant={active ? 'secondary' : 'ghost'}
                  asChild
                  className="w-full justify-start"
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        {user && (
          <div className="mt-auto border-t border-gray-200 p-6">
            <div className="text-xs text-gray-500">
              <p className="font-semibold uppercase">Role</p>
              <p className="mt-1 capitalize text-gray-600">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
