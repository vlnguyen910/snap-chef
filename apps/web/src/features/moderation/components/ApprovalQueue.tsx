import { useState, useEffect } from 'react';
import { Clock, User, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Loading from '@/components/common/Loading';
import ErrorState from '@/components/common/ErrorState';
import { useModeration } from '../hooks/useModeration';
import type { ModerationQueue } from '@/types';

export default function ApprovalQueue() {
  const { fetchQueue, approveRecipe, rejectRecipe, isLoading, error } = useModeration();
  const [queue, setQueue] = useState<ModerationQueue[]>([]);
  const [selectedItem, setSelectedItem] = useState<ModerationQueue | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const items = await fetchQueue();
    if (items) setQueue(items);
  };

  const handleApprove = async (itemId: string) => {
    const success = await approveRecipe(itemId);
    if (success) {
      setQueue(queue.filter(item => item.id !== itemId));
      setSelectedItem(null);
    }
  };

  const handleReject = async (itemId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    const success = await rejectRecipe(itemId, rejectReason);
    if (success) {
      setQueue(queue.filter(item => item.id !== itemId));
      setSelectedItem(null);
      setRejectReason('');
    }
  };

  if (isLoading && queue.length === 0) {
    return <Loading message="Loading moderation queue..." />;
  }

  if (error && queue.length === 0) {
    return <ErrorState message={error} onRetry={loadQueue} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Moderation Queue</h2>
        <span className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full font-medium">
          {queue.length} pending
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <p className="text-gray-600">No items in queue</p>
          <p className="text-sm text-gray-500 mt-1">All caught up! 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue List */}
          <div className="space-y-4">
            {queue.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedItem?.id === item.id ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {item.recipe.title}
                  </h3>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium whitespace-nowrap ml-2">
                    Pending
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {item.recipe.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{item.recipe.user?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6 h-fit">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedItem.recipe.title}
                  </h3>
                  <Button variant="outline" size="sm">
                    <Eye size={16} className="mr-2" />
                    Preview
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-gray-600">Submitted by:</span>
                    <span className="font-medium">{selectedItem.recipe.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium">
                      {new Date(selectedItem.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedItem.recipe.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Cuisine:</span>
                      <span className="ml-2 font-medium">{selectedItem.recipe.cuisine || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="ml-2 font-medium">{selectedItem.recipe.difficulty || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Prep Time:</span>
                      <span className="ml-2 font-medium">{selectedItem.recipe.prepTime} min</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cook Time:</span>
                      <span className="ml-2 font-medium">{selectedItem.recipe.cookingTime} min</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Button 
                    onClick={() => handleApprove(selectedItem.id)}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={20} className="mr-2" />
                    Approve Recipe
                  </Button>

                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (required)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <Button 
                      onClick={() => handleReject(selectedItem.id)}
                      disabled={isLoading || !rejectReason.trim()}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle size={20} className="mr-2" />
                      Reject Recipe
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Select an item to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
