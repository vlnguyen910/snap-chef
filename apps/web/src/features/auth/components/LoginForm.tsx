import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '@/lib/store';
import GoogleAuthButton from './GoogleAuthButton';

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signin, signinWithGoogle, isLoading, error } = useAuth();
  const user = useStore((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const pendingVerification =
    location.state &&
    typeof location.state === 'object' &&
    'pendingVerification' in location.state
      ? Boolean((location.state as { pendingVerification?: boolean }).pendingVerification)
      : false;

  const signupEmail =
    location.state &&
    typeof location.state === 'object' &&
    'signupEmail' in location.state
      ? String((location.state as { signupEmail?: string }).signupEmail || '')
      : '';

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to home with replace to prevent back navigation
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignin = async () => {
    const success = await signinWithGoogle();
    if (success) {
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signin(formData.email, formData.password);
    if (success) {
      navigate('/');
    } else {
      // Clear password field on failed login
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">SnapChef Account</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/auth/signup" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign up
          </Link>
        </p>
      </div>

      <GoogleAuthButton
        onClick={handleGoogleSignin}
        loading={isLoading}
        label="Continue with Google"
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 font-medium tracking-wide text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {pendingVerification && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Tài khoản đã được tạo. Vui lòng kiểm tra email
            {signupEmail ? ` (${signupEmail}) ` : ' '}
            để xác thực trước khi đăng nhập.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-11 rounded-xl border-input/80 bg-background pl-10 pr-4"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-11 rounded-xl border-input/80 bg-background pl-10 pr-11"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>
          <Link to="/auth/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-700">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="h-11 w-full rounded-xl bg-orange-600 text-white hover:bg-orange-700" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
