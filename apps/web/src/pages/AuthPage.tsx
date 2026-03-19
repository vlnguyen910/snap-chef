import LoginForm from '@/features/auth/components/LoginForm';
import RegisterForm from '@/features/auth/components/RegisterForm';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';
import { useLocation } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function AuthPage() {
  const location = useLocation();
  const isSignin = location.pathname.includes('signin');
  const isSignup = location.pathname.includes('signup');
  const isForgotPassword = location.pathname.includes('forgot-password');
  const isResetPassword = location.pathname.includes('reset-password');
  const isPrimaryAuthPage = isSignin || isSignup;

  // Update browser title when page changes
  const getTitle = () => {
    if (isSignup) return 'Sign Up';
    if (isForgotPassword) return 'Forgot Password';
    if (isResetPassword) return 'Reset Password';
    return 'Sign In';
  };
  
  useDocumentTitle(getTitle());

  const renderForm = () => {
    if (isSignup) return <RegisterForm />;
    if (isForgotPassword) return <ForgotPasswordForm />;
    if (isResetPassword) return <ResetPasswordForm />;
    return <LoginForm />;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef2e8,_#ffffff_45%,_#fff7ed)] px-4 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-orange-100/80 bg-white/95 shadow-[0_22px_70px_-28px_rgba(12,12,13,0.35)] backdrop-blur">
          <div className="grid min-h-[720px] lg:grid-cols-[1.1fr_0.9fr]">
            <section className="hidden bg-gradient-to-br from-[#191411] via-[#2f1c14] to-[#8a4724] p-12 text-orange-50 lg:flex lg:flex-col lg:justify-between">
              <div className="space-y-6">
                <p className="inline-flex rounded-full border border-orange-200/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-orange-100">
                  SnapChef
                </p>
                <h1 className="max-w-md text-5xl font-semibold leading-tight tracking-tight">
                  Cook smarter, share faster, grow your foodie network.
                </h1>
                <p className="max-w-md text-base leading-relaxed text-orange-100/80">
                  Join thousands of home chefs collecting ideas, posting recipes, and discovering dishes made by people with the same taste.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Recipes shared', value: '12K+' },
                  { label: 'Monthly cooks', value: '85K' },
                  { label: 'Avg. save rate', value: '4.9★' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-2xl font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-orange-100/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
              <div className={`w-full ${isPrimaryAuthPage ? 'max-w-md' : 'max-w-lg'}`}>
                <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
                  {renderForm()}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}