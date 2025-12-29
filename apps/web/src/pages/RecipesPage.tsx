import RecipeList from '@/features/recipes/components/RecipeList';
import { useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function RecipesPage() {
  const { status } = useParams<{ status?: 'pending' | 'approved' }>();
  useDocumentTitle(status === 'pending' ? 'Pending Recipes' : 'All Recipes');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {status === 'pending' ? 'Pending Recipes' : 'All Recipes'}
        </h1>
        <p className="text-gray-600">
          {status === 'pending' 
            ? 'Browse recipes awaiting approval' 
            : 'Explore our collection of delicious recipes'}
        </p>
      </div>

      <RecipeList />
    </div>
  );
}
