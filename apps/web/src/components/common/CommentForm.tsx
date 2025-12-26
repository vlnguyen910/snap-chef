import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { StarRating } from '../common/StarRating';
import axios from 'axios';
import type { CreateCommentPayload } from '@/types';

interface CommentFormProps {
  onSubmit: (payload: CreateCommentPayload) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Comment Form Component
 * Form to create a new comment with text input and star rating selector
 */
export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, isLoading = false }) => {
  const { id: recipeId } = useParams<{ id: string }>();
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!content.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (rating < 0 || rating > 5 || !Number.isInteger(rating)) {
      setError('Rating must be an integer between 0 and 5');
      return;
    }

    if (!recipeId) {
      setError('Recipe ID is missing');
      return;
    }

    try {
      // Call parent onSubmit callback - parent will handle API call
      await onSubmit({ content: content.trim(), rating: Math.floor(Number(rating)) });

      // Reset form on success
      setContent('');
      setRating(0);
    } catch (err: any) {
      console.error('❌ Error posting comment:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      // Handle specific error codes
      if (err.response?.status === 401) {
        setError('🔐 Unauthorized: You must be logged in. Please check your token.');
      } else if (err.response?.status === 403) {
        setError('🚫 Forbidden: Your session has expired. Please log in again.');
      } else if (err.response?.status === 400) {
        setError(`❌ Bad Request: ${err.response?.data?.message || 'Invalid comment data'}`);
      } else if (err.response?.status === 500) {
        // ✅ User-friendly 500 error handling
        setError('⚠️ System Error: You might have already commented on this recipe, or the server is busy. Please try again later.');
        alert('System Error: You might have already commented on this recipe, or the server is busy.');
      } else {
        setError(err.message || 'Failed to post comment. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label htmlFor="comment-rating" className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700 mb-2">
          Your Comment
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Share your thoughts about this recipe..."
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !content.trim() || rating === 0}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
};
