import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function EmailVerifiedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail, isLoading, error } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [hasAttemptedVerification, setHasAttemptedVerification] =
    useState(false);

  useEffect(() => {
    if (token) {
      void handleVerification();
      return;
    }

    setHasAttemptedVerification(true);
  }, [token]);

  const handleVerification = async () => {
    setHasAttemptedVerification(true);
    const success = await verifyEmail(token!);
    if (success) {
      setIsVerified(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        {isLoading || !hasAttemptedVerification ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verifying your email...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your account.
            </p>
          </div>
        ) : isVerified ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full animate-bounce">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Email Verified!
            </h2>
            <p className="text-gray-600">
              Thank you for verifying your email. Your account is now fully
              active and ready to explore culinary delights.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => navigate("/auth/signin")}
                className="w-full py-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
              >
                Go to Sign In
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : hasAttemptedVerification ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verification Failed
            </h2>
            <p className="text-gray-600">
              {error ||
                "The verification link is invalid or has expired. Please try signing up again or contact support."}
            </p>
            <div className="pt-4 space-y-2">
              <Button
                onClick={() => navigate("/auth/signup")}
                variant="outline"
                className="w-full rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Back to Sign Up
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
