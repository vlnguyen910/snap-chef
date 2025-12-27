import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { User as UserIcon, LogOut, ChevronDown, Users } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function UserMenu() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/auth/signin');
  };

  if (!user) return null;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center gap-3 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-all group">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username || user.email}
              className="h-9 w-9 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white font-bold text-sm shadow-sm">
              {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="max-w-[100px] truncate font-medium">
            {user.username || user.email}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-orange-600 transition-colors" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`${
                    active ? 'bg-orange-50 text-orange-600' : 'text-gray-900'
                  } group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors`}
                >
                  <UserIcon className="h-5 w-5" aria-hidden="true" />
                  Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/follow"
                  className={`${
                    active ? 'bg-orange-50 text-orange-600' : 'text-gray-900'
                  } group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors`}
                >
                  <Users className="h-5 w-5" aria-hidden="true" />
                  Following & Followers
                </Link>
              )}
            </Menu.Item>
          </div>

          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-orange-50 text-orange-600' : 'text-gray-900'
                  } group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors`}
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
