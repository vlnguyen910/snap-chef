import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { commentService } from '@/services/commentService';
import { CommentForm } from '../common/CommentForm';
import { StarRating } from '../common/StarRating';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast-store';
import Swal from 'sweetalert2';
import type { Comment, CreateCommentPayload, UpdateCommentPayload } from '@/types';

interface RecipeCommentsProps {
  recipeOwnerId?: string; // ID of the recipe owner (for delete permission check)
}

/**
 * Recipe Comments Component
 * Displays and manages comments for a specific recipe
 * Features:
 * - View comments (public, no login required) ✅
 * - Add comment (requires login) ✅
 * - Edit comment (comment owner only)
 * - Delete comment (comment owner OR recipe owner)
 */
export const RecipeComments: React.FC<RecipeCommentsProps> = ({ recipeOwnerId }) => {
  const { id: recipeId } = useParams<{ id: string }>();
  const user = useStore((state) => state.user); // ✅ Get user from global store
  
  // 🔍 DEBUG: Log user state
  console.log('🔍 RecipeComments user:', user);
  console.log('🔍 RecipeComments recipeOwnerId:', recipeOwnerId);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(0);

  // Fetch comments on mount - FIXED: Only depends on recipeId to prevent infinite loop
  useEffect(() => {
    if (!recipeId) return;

    const fetchComments = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      
      try {
        const data = await commentService.getCommentsByRecipeId(recipeId);
        setComments(data);
      } catch (error: any) {
        console.error('Failed to fetch comments:', error);
        
        // Set error state to prevent retries
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load comments';
        setError(errorMessage);
        
        // Log detailed error for debugging
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [recipeId]); // ONLY depend on recipeId

  const fetchComments = async () => {
    if (!recipeId) return;
    
    setIsLoading(true);
    setError(null); // Clear previous errors
    
    try {
      const data = await commentService.getCommentsByRecipeId(recipeId);
      setComments(data);
    } catch (error: any) {
      console.error('Failed to fetch comments:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load comments';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async (payload: CreateCommentPayload) => {
    if (!recipeId) return;
    
    setIsSubmitting(true);
    try {
      await commentService.createComment(recipeId, payload);
      await fetchComments(); // Refresh comments list
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!recipeId) return;
    
    const result = await Swal.fire({
      title: 'Delete Comment?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await commentService.deleteComment(recipeId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Comment not found');
      } else if (error.response?.status === 401) {
        toast.error('You are not authorized to delete this comment');
      } else {
        toast.error('Failed to delete comment');
      }
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setEditRating(comment.rating);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
    setEditRating(0);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!recipeId) return;

    try {
      const payload: UpdateCommentPayload = {
        content: editContent.trim(),
        rating: editRating,
      };

      await commentService.updateComment(recipeId, commentId, payload);
      await fetchComments(); // Refresh comments list
      handleCancelEdit();
    } catch (error) {
      alert('Failed to update comment');
    }
  };

  // Check if current user can delete a comment
  // Rule: Comment Owner OR Recipe Owner (v1.1.0)
  const canDeleteComment = (comment: Comment): boolean => {
    if (!user?.id) return false;
    return comment.userId === user.id || recipeOwnerId === user.id;
  };

  // Check if current user can edit a comment
  // Rule: Comment Owner only
  const canEditComment = (comment: Comment): boolean => {
    if (!user?.id) return false;
    return comment.userId === user.id;
  };

  if (!recipeId) {
    return <div className="text-red-500">Recipe ID not found</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Comments & Ratings</h2>

      {/* Comment Form - ONLY show if user is logged in */}
      {user ? (
        <CommentForm onSubmit={handleCreateComment} isLoading={isSubmitting} />
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-700 font-medium">Please <a href="/auth/signin">log in</a> to join the discussion</p>
        </div>
      )}

      {/* Comments List - ALWAYS visible, regardless of login status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading comments...</div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={fetchComments}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {comment.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-600">
                        {comment.user?.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {comment.user?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {canEditComment(comment) && (
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-2">
                <StarRating value={comment.rating} readonly size="sm" />
              </div>

              {/* Comment Content */}
              {editingCommentId === comment.id ? (
                <div className="space-y-3">
                  <StarRating value={editRating} onChange={setEditRating} size="md" />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
