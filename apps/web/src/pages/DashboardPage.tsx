import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChefHat, 
  Heart, 
  Users, 
  ThumbsUp, 
  CheckCircle, 
  Clock,
  TrendingUp
} from 'lucide-react';

// Mock data
const stats = [
  {
    id: 1,
    label: 'Total Recipes',
    value: '24',
    icon: ChefHat,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    id: 2,
    label: 'Total Likes',
    value: '1,342',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    id: 3,
    label: 'Followers',
    value: '567',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
];

const recentActivities = [
  {
    id: 1,
    type: 'like',
    message: 'Sarah Johnson liked your recipe "Spicy Thai Basil Chicken"',
    time: '2 hours ago',
    icon: ThumbsUp,
    color: 'text-pink-600',
  },
  {
    id: 2,
    type: 'approval',
    message: 'Admin approved your post "Healthy Breakfast Bowl"',
    time: '5 hours ago',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    id: 3,
    type: 'like',
    message: 'Michael Chen liked your recipe "Classic Carbonara"',
    time: '1 day ago',
    icon: ThumbsUp,
    color: 'text-pink-600',
  },
  {
    id: 4,
    type: 'trending',
    message: 'Your recipe "Vietnamese Pho" is trending this week!',
    time: '2 days ago',
    icon: TrendingUp,
    color: 'text-orange-600',
  },
  {
    id: 5,
    type: 'like',
    message: 'Emma Wilson liked your recipe "Chocolate Lava Cake"',
    time: '3 days ago',
    icon: ThumbsUp,
    color: 'text-pink-600',
  },
];

const drafts = [
  {
    id: 1,
    title: 'Mediterranean Quinoa Salad',
    lastEdited: '2 hours ago',
    progress: 75,
    image: '🥗',
  },
  {
    id: 2,
    title: 'Homemade Sourdough Bread',
    lastEdited: '1 day ago',
    progress: 45,
    image: '🍞',
  },
  {
    id: 3,
    title: 'Korean Bibimbap Bowl',
    lastEdited: '3 days ago',
    progress: 60,
    image: '🍲',
  },
  {
    id: 4,
    title: 'French Onion Soup',
    lastEdited: '5 days ago',
    progress: 30,
    image: '🍜',
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-orange-600">Light Raven</span>
            </h1>
            <p className="mt-1 text-gray-600">
              Here's what's happening with your recipes today
            </p>
          </div>
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link to="/recipes/create" className="flex items-center gap-2">
              <ChefHat size={20} />
              Create New Recipe
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <Icon className={stat.color} size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className={`mt-1 ${activity.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue Writing (Drafts) */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Continue Writing
            </h2>
            <div className="space-y-4">
              {drafts.map((draft) => (
                <Link
                  key={draft.id}
                  to={`/recipes/edit/${draft.id}`}
                  className="block rounded-lg border border-gray-100 p-4 transition-all hover:border-orange-200 hover:bg-orange-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{draft.image}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {draft.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Last edited {draft.lastEdited}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span className="font-medium">{draft.progress}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-orange-600 transition-all"
                            style={{ width: `${draft.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {drafts.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <ChefHat className="mx-auto mb-2 text-gray-400" size={40} />
                <p>No drafts yet. Start creating a new recipe!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
