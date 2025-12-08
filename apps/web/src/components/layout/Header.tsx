import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useStore();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-orange-600 transition-colors hover:text-orange-700">
            <span className="text-3xl">🍳</span>
            Snap Chef
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden gap-1 md:flex">
            <Button variant={isActive('/') ? 'secondary' : 'ghost'} asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant={isActive('/recipes') ? 'secondary' : 'ghost'} asChild>
              <Link to="/recipes">Recipes</Link>
            </Button>
            
            {isAuthenticated && (
              <>
                <Button variant={isActive('/profile') ? 'secondary' : 'ghost'} asChild>
                  <Link to="/profile">My Recipes</Link>
                </Button>
                
                {user?.role === 'moderator' && (
                  <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} asChild>
                    <Link to="/admin">Moderation</Link>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <UserIcon size={18} />
                    {user.username}
                  </Link>
                </Button>
                <Button variant="default" onClick={logout} className="flex items-center gap-2">
                  <LogOut size={18} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link to="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <Button variant={isActive('/') ? 'secondary' : 'ghost'} asChild className="w-full justify-start" onClick={() => setIsOpen(false)}>
                <Link to="/">Home</Link>
              </Button>
              <Button variant={isActive('/recipes') ? 'secondary' : 'ghost'} asChild className="w-full justify-start" onClick={() => setIsOpen(false)}>
                <Link to="/recipes">Recipes</Link>
              </Button>
              
              {isAuthenticated && (
                <>
                  <Button variant={isActive('/profile') ? 'secondary' : 'ghost'} asChild className="w-full justify-start" onClick={() => setIsOpen(false)}>
                    <Link to="/profile">My Recipes</Link>
                  </Button>
                  
                  {user?.role === 'moderator' && (
                    <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} asChild className="w-full justify-start" onClick={() => setIsOpen(false)}>
                      <Link to="/admin">Moderation</Link>
                    </Button>
                  )}
                </>
              )}

              <div className="mt-2 flex flex-col gap-2 border-t border-gray-200 pt-2">
                {isAuthenticated && user ? (
                  <>
                    <Button variant="ghost" asChild className="w-full justify-start" onClick={() => setIsOpen(false)}>
                      <Link to="/profile" className="flex items-center gap-2">
                        <UserIcon size={18} />
                        {user.username}
                      </Link>
                    </Button>
                    <Button variant="default" onClick={() => { logout(); setIsOpen(false); }} className="w-full">
                      <LogOut size={18} className="mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full" onClick={() => setIsOpen(false)}>
                      <Link to="/auth/login">Login</Link>
                    </Button>
                    <Button variant="default" asChild className="w-full" onClick={() => setIsOpen(false)}>
                      <Link to="/auth/register">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
