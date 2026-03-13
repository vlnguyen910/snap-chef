import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, Bookmark, Plus, User, ChefHat } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useStore } from '@/lib/store';
import {
  FeedHero,
  FeedSidebar,
  FeedFilterBar,
  RecipeFeedCard,
  MOCK_RECIPES,
  MOCK_TOP_CHEFS,
  MOCK_TRENDING_CATEGORIES,
} from '@/features/feed';

type FilterOption = 'all' | 'popular' | 'recent';

const MOBILE_NAV_ITEMS = [
  { icon: Home, label: 'Home', to: '/' },
  { icon: Compass, label: 'Explore', to: '/recipes' },
  { spacer: true },
  { icon: Bookmark, label: 'Saved', to: '/favorites' },
  { icon: User, label: 'Profile', to: '/profile' },
];

export default function HomePage() {
  useDocumentTitle('Snap Chef — Home Feed');
  const { isAuthenticated } = useStore();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const filteredRecipes = MOCK_RECIPES; // API filtering will be added in Phase 2.3

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <FeedSidebar
            categories={MOCK_TRENDING_CATEGORIES}
            topChefs={MOCK_TOP_CHEFS}
          />

          {/* Main Feed */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Hero */}
            <FeedHero />

            {/* Filter Bar */}
            <FeedFilterBar active={activeFilter} onChange={setActiveFilter} />

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRecipes.map((recipe) => (
                <Link to={`/recipes/${recipe.id}`} key={recipe.id} className="block">
                  <RecipeFeedCard recipe={recipe} />
                </Link>
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center py-6">
              <button className="flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all active:scale-95">
                <span>Load More Recipes</span>
                <span className="text-lg">↓</span>
              </button>
            </div>

            {/* Mobile: Top Chefs horizontal scroll */}
            <div className="flex lg:hidden flex-col gap-4">
              <h3 className="text-xl font-black">Top Chefs This Week</h3>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                {MOCK_TOP_CHEFS.map((chef) => (
                  <div key={chef.id} className="flex flex-col items-center gap-2 min-w-[72px]">
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-primary to-orange-400">
                      <img
                        src={chef.avatar}
                        alt={chef.name}
                        className="w-full h-full rounded-full border-2 border-white object-cover"
                      />
                    </div>
                    <span className="text-xs font-bold text-center leading-none">
                      {chef.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FAB: Add Recipe */}
      {isAuthenticated && (
        <div className="fixed bottom-20 md:bottom-10 right-6 md:right-10 z-40">
          <Link to="/recipes/create">
            <button
              aria-label="Create new recipe"
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group"
            >
              <Plus size={28} className="group-hover:rotate-90 transition-transform" />
            </button>
          </Link>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-background-dark border-t border-slate-100 dark:border-white/5 px-6 py-3 flex items-center justify-between z-50">
        {MOBILE_NAV_ITEMS.map((item, idx) =>
          'spacer' in item ? (
            <div key={idx} className="w-10" />
          ) : (
            <Link
              key={item.to}
              to={item.to!}
              className="text-slate-400 flex flex-col items-center gap-1 hover:text-primary transition-colors"
            >
              <item.icon size={22} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          )
        )}
      </nav>

      {/* Spacing for mobile bottom nav */}
      <div className="md:hidden h-20" />
    </div>
  );
}
