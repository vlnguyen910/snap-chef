import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User as UserIcon, LogOut, Search, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import UserMenu from './UserMenu';
import { useSearchUsers } from '@/hooks/useUser';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchUserResult } from '@/types';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const isAuthenticated = !!user;

  const debouncedQuery = useDebounce(searchQuery, 300);
  
  const { data: users = [], isLoading, error } = useSearchUsers(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length > 0 && isAuthenticated }
  );

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignout = () => {
    logout();
    setIsOpen(false);
    navigate('/auth/signin');
  };

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}/profile`);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/recipes', label: 'Recipes' },
    { path: '/create-recipe', label: 'Create Recipe' },
    ...(isAuthenticated ? [{ path: '/my-recipes', label: 'My Recipes' }] : []),
    ...(user?.role === 'moderator' ? [{ path: '/moderation', label: 'Moderation' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        {/* Desktop Layout - 3 Column Grid */}
        <div className="hidden md:grid md:grid-cols-3 items-center h-16 gap-4">
          {/* Left Section: Logo + Search Bar */}
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors flex-shrink-0"
            >
              SnapChef
            </Link>
            
            {/* User Search */}
            {isAuthenticated && (
              <div className="relative w-64">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search users..."
                    className="w-full pl-11 pr-4 py-2 bg-orange-100 rounded-full border border-transparent focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && searchQuery && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSearchOpen(false)}
                    />
                    
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                          <span className="ml-2 text-gray-600">Searching...</span>
                        </div>
                      ) : error ? (
                        <div className="px-4 py-8 text-center text-red-600 text-sm">
                          Failed to search users
                        </div>
                      ) : users.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          No users found for "{searchQuery}"
                        </div>
                      ) : (
                        <div className="py-2">
                          {users.map((user: SearchUserResult) => (
                            <div
                              key={user.id}
                              onClick={() => handleUserClick(user.id)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors cursor-pointer"
                            >
                              <img 
                                src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username} 
                                alt={user.username}
                                className="h-10 w-10 rounded-full object-cover"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username;
                                }}
                              />
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate text-sm">
                                  {user.username}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </p>
                                {user.bio && (
                                  <p className="text-xs text-gray-400 truncate mt-0.5">
                                    {user.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Center Section: Navigation Links */}
          <nav className="flex items-center justify-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors relative group whitespace-nowrap ${
                  isActive(link.path)
                    ? 'text-orange-600 font-bold'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-[-20px] left-0 right-0 h-0.5 bg-orange-600"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Section: User Profile / Auth Buttons */}
          <div className="flex items-center justify-end gap-3">
            {isAuthenticated && user ? (
              <UserMenu />
            ) : (
              <>
                <Button variant="ghost" asChild className="hover:text-orange-600">
                  <Link to="/auth/signin">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Link to="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            SnapChef
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-700 hover:text-orange-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {/* Mobile Nav Links */}
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-orange-600 font-bold bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 transition-colors"
                  >
                    <UserIcon size={18} />
                    <span>{user.username || user.email}</span>
                  </Link>
                  <button
                    onClick={handleSignout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/signin"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/signup"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}