import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorState({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
  fullScreen = false 
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-2">
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        {content}
      </div>
    );
  }

  return <div className="flex min-h-[400px] items-center justify-center px-4">{content}</div>;
}
