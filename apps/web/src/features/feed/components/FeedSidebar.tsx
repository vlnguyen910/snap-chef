import { Link } from 'react-router-dom';
import { Home, Compass, Bookmark, History, TrendingUp, UserPlus } from 'lucide-react';
import type { TrendingCategory, TopChef } from '../data/mockData';

interface FeedSidebarProps {
  categories: Readonly<TrendingCategory[]>;
  topChefs: Readonly<TopChef[]>;
}

const NAV_ITEMS = [
  { icon: Home, label: 'Feed', to: '/', active: true },
  { icon: Compass, label: 'Explore', to: '/recipes', active: false },
  { icon: Bookmark, label: 'Saved Recipes', to: '/favorites', active: false },
  { icon: History, label: 'Cooked', to: '/dashboard', active: false },
];

export default function FeedSidebar({ categories, topChefs }: Readonly<FeedSidebarProps>) {
  return (
    <aside className="hidden lg:flex flex-col gap-8 w-64 shrink-0">
      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ icon: Icon, label, to, active }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
              active
                ? 'bg-primary text-white'
                : 'hover:bg-primary/10 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Trending Categories */}
      <div>
        <h3 className="px-4 mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Trending Categories
        </h3>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors w-full text-left"
            >
              <span>
                {cat.emoji} {cat.name}
              </span>
              <span className="text-xs text-slate-400">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Chefs */}
      <div>
        <h3 className="px-4 mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Top Chefs
        </h3>
        <div className="flex flex-col gap-4 px-2">
          {topChefs.map((chef) => (
            <div key={chef.id} className="flex items-center gap-3">
              <img
                src={chef.avatar}
                alt={chef.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{chef.name}</p>
                <p className="text-xs text-slate-500">{chef.recipeCount} recipes</p>
              </div>
              <button className="text-primary text-xs font-bold flex items-center gap-1 hover:opacity-75 transition-opacity">
                <UserPlus size={14} />
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
