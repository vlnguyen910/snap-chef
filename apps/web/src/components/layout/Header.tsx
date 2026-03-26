import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChefHat,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import UserMenu from "./UserMenu";
import GlobalSearch from "@/components/common/GlobalSearch";
import { toast } from "@/lib/toast-store";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const isAuthenticated = !!user;

  const handleSignout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  const handleNotificationClick = () => {
    if (!isAuthenticated) {
      navigate("/auth/signin");
      return;
    }
    toast.info("Notification center will be connected soon.");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="container mx-auto px-4">
        {/* Desktop */}
        <div className="hidden h-16 items-center justify-between gap-4 md:flex">
          {/* Left: Brand */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-orange-600 transition-colors hover:text-orange-700"
          >
            <ChefHat className="size-5" />
            SnapChef
          </Link>

          {/* Center: Search */}
          <GlobalSearch className="w-[420px]" />

          {/* Right: User related */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleNotificationClick}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-orange-100 hover:text-orange-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-orange-900/40 dark:hover:text-orange-300"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {isAuthenticated && user ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/auth/signin">
                  <Button variant="ghost" className="hover:text-orange-600">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button className="bg-orange-600 text-white hover:bg-orange-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile top bar */}
        <div className="flex h-16 items-center justify-between md:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xl font-extrabold text-orange-600"
          >
            <ChefHat className="size-5" />
            SnapChef
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={handleNotificationClick}
              className="rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        {isOpen && (
          <div className="space-y-3 border-t border-slate-200 py-4 dark:border-slate-800 md:hidden">
            <GlobalSearch className="w-full" />

            <div className="space-y-1">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserIcon size={18} />
                    <span>{user.username || user.email}</span>
                  </Link>
                  <button
                    onClick={handleSignout}
                    className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-slate-800"
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
                    className="block rounded-md px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/signup"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-md bg-orange-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700"
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
