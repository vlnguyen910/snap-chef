import { Link } from 'react-router-dom';
import { ChefHat, Search, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              <TrendingUp size={16} />
              Join 10,000+ home chefs worldwide
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Discover, Cook, and Share
              <span className="block text-orange-600 mt-2">Amazing Recipes</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your culinary journey starts here. Explore thousands of recipes, create your own masterpieces, and share them with a passionate community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/recipes">
                <Button size="lg" className="w-full sm:w-auto">
                  <Search size={20} className="mr-2" />
                  Explore Recipes
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <ChefHat size={20} className="mr-2" />
                  Start Cooking
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative blob */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">1,000+</div>
              <div className="text-gray-600">Recipes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">37</div>
              <div className="text-gray-600">Cuisines</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">10k+</div>
              <div className="text-gray-600">Community Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Three simple steps to become part of the SnapChef community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Discover</h3>
              <p className="text-gray-600">
                Browse through thousands of recipes from various cuisines. Filter by ingredients, cooking time, and difficulty level.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <ChefHat className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Cook</h3>
              <p className="text-gray-600">
                Follow step-by-step instructions with ingredients lists. Fork recipes and customize them to your taste.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Share</h3>
              <p className="text-gray-600">
                Share your own recipes with the community. Get feedback, ratings, and connect with fellow food lovers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Culinary Adventure?
          </h2>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of home chefs sharing their passion for cooking
          </p>
          <Link to="/register">
            <Button size="lg" variant="outline" className="bg-white text-orange-600 hover:bg-orange-50 border-0">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
