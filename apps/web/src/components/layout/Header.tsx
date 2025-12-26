import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User as UserIcon, LogOut, Search } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import UserMenu from './UserMenu';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const isAuthenticated = !!user;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignout = () => {
    logout();
    setIsOpen(false);
    navigate('/auth/signin');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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
            
            <form 
              onSubmit={handleSearch}
              className="flex items-center"
            >
              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-11 pr-4 py-2 bg-orange-100 rounded-full border border-transparent focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>
            </form>
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
            {/* Search Bar (Mobile) */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-11 pr-4 py-2 bg-gray-100 rounded-full border border-transparent focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>
            </form>

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