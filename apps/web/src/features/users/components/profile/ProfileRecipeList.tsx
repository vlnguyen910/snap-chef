import { Loader2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProfileRecipe } from '../../types/profile';

interface ProfileRecipeListProps {
  activeTab: 'created' | 'liked';
  setActiveTab: (tab: 'created' | 'liked') => void;
  loadingRecipes: boolean;
  userRecipes: ProfileRecipe[];
  likedRecipes: ProfileRecipe[];
  isOwnProfile: boolean;
}

export function ProfileRecipeList({
  activeTab,
  setActiveTab,
  loadingRecipes,
  userRecipes,
  likedRecipes,
  isOwnProfile
}: ProfileRecipeListProps) {
  const navigate = useNavigate();

  return (
    <div className="mt-12">
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('created')}
          className={`pb-3 px-6 text-base font-semibold transition-all relative ${
            activeTab === 'created'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
          }`}
        >
          Công thức đã tạo
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('liked')}
            className={`pb-3 px-6 text-base font-semibold transition-all relative ${
              activeTab === 'liked'
                ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
            }`}
          >
            Công thức đã thích
          </button>
        )}
      </div>

      {loadingRecipes ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(activeTab === 'created' ? userRecipes : likedRecipes).length > 0 ? (
            (activeTab === 'created' ? userRecipes : likedRecipes).map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                className="group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={recipe.thumbnail_url || 'https://via.placeholder.com/400x300'}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">
                      {recipe.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    <span className="text-sm font-semibold">
                      {recipe.likes_count || 0} lượt thích
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {activeTab === 'created'
                  ? 'Chưa có công thức nào'
                  : 'Chưa có công thức yêu thích'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
