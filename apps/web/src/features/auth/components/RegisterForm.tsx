import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '@/lib/store';
import { 
  validateSignupData, 
  transformSignupData,
  type SignupFormInputs 
} from '../utils/auth.helpers';
import GoogleAuthButton from './GoogleAuthButton';

export default function RegisterForm() {
  const navigate = useNavigate();
  const { signup, signinWithGoogle, isLoading, error: authError } = useAuth();
  const user = useStore((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<SignupFormInputs>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to home with replace to prevent back navigation
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignup = async () => {
    const success = await signinWithGoogle();
    if (success) {
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    // Validate form data (only use fullName, email, password)
    const { valid, errors } = validateSignupData({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
    });
    if (!valid) {
      setValidationErrors(errors);
      return;
    }

    // Transform to backend payload
    const payload = transformSignupData({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
    });

    // Call signup
    const result = await signup(payload);
    if (result) {
      window.toast?.success?.(
        result.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'
      );
      navigate('/auth/signin', {
        state: {
          pendingVerification: result.requiresEmailVerification,
          signupEmail: formData.email,
        },
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">SnapChef Account</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/signin" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      </div>

      <GoogleAuthButton
        onClick={handleGoogleSignup}
        loading={isLoading}
        label="Sign up with Google"
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
        {(authError || validationErrors.length > 0) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {authError}
            {validationErrors.map((err, idx) => (
              <div key={idx}>{err}</div>
            ))}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="h-11 rounded-xl border-input/80 bg-background pl-10 pr-4"
              placeholder="Nguyen Van A"
            />
          </div>
          {/* field-level error removed, now shown above */}
        </div>

        {/* Email */}
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
              className="h-11 rounded-xl border-input/80 bg-background pl-10 pr-4"
              placeholder="you@example.com"
            />
          </div>
          {/* field-level error removed, now shown above */}
        </div>

        {/* Password */}
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
              className="h-11 rounded-xl border-input/80 bg-background pl-10 pr-11"
              placeholder="At least 8 characters"
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
          {/* field-level error removed, now shown above */}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="h-11 rounded-xl border-input/80 bg-background pl-10 pr-11"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* field-level error removed, now shown above */}
        </div>

        <Button type="submit" size="lg" className="h-11 w-full rounded-xl bg-orange-600 text-white hover:bg-orange-700" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  );
}