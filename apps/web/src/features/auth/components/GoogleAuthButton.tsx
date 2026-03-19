import { Button } from '@/components/ui/button';

type GoogleAuthButtonProps = {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.8-4.2 2.8-7.2 0-.7-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.9-.9 6.6-2.5l-3.1-2.4c-.9.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2H3.1v2.5C4.8 19.8 8.1 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.3 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.7H3.1C2.4 9.1 2 10.5 2 12s.4 2.9 1.1 4.3l3.2-2.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3.9 14.7 3 12 3 8.1 3 4.8 5.2 3.1 8.7l3.2 2.5c.8-2.4 3-4.4 5.7-4.4z"
      />
    </svg>
  );
}

export default function GoogleAuthButton({
  onClick,
  disabled,
  loading,
  label = 'Continue with Google',
}: GoogleAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-11 w-full rounded-xl border-border bg-card text-foreground hover:bg-muted"
      onClick={onClick}
      disabled={disabled || loading}
    >
      <GoogleIcon />
      {loading ? 'Connecting...' : label}
    </Button>
  );
}
