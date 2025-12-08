import { Link } from 'react-router-dom';
import { Home, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-9xl font-bold text-orange-600">404</div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-gray-600">
            Oops! The recipe you're looking for doesn't exist or has been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home size={20} className="mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link to="/recipes">
            <Button variant="outline" className="w-full sm:w-auto">
              <ChefHat size={20} className="mr-2" />
              Browse Recipes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
