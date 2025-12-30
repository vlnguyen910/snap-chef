import { api } from '@/lib/axios';
import type { Comment, CreateCommentPayload, UpdateCommentPayload } from '@/types';

export const commentService = {
  /**
   * Get all comments for a recipe
   * Anyone can view (even non-logged-in users)
   */
  getCommentsByRecipeId: async (recipeId: string): Promise<Comment[]> => {
    try {
      const response = await api.get<any[]>(`/recipes/${recipeId}/comments`);
      return (response || []).map(normalizeComment);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  /**
   * Create a new comment for a recipe
   * Requires authentication
   * @throws 401 if no token in cookie
   * @throws 403 if token expired
   */
  createComment: async (
    recipeId: string,
    payload: CreateCommentPayload
  ): Promise<{ message: string }> => {
    // Validate rating before sending
    if (payload.rating < 0 || payload.rating > 5 || !Number.isInteger(payload.rating)) {
      throw new Error('Rating must be an integer between 0 and 5');
    }

    const response = await api.post<{ message: string }>(
      `/recipes/${recipeId}/comments`,
      payload
    );
    return response;
  },

  /**
   * Update a comment
   * Only comment owner can edit
   */
  updateComment: async (
    recipeId: string,
    commentId: string,
    payload: UpdateCommentPayload
  ): Promise<Comment> => {
    // Validate rating if provided
    if (payload.rating !== undefined) {
      if (payload.rating < 0 || payload.rating > 5 || !Number.isInteger(payload.rating)) {
        throw new Error('Rating must be an integer between 0 and 5');
      }
    }

    const response = await api.patch<any>(
      `/recipes/${recipeId}/comments/${commentId}`,
      payload
    );
    return normalizeComment(response);
  },

  /**
   * Delete a comment
   * Can be deleted by: Comment Owner OR Recipe Owner (v1.1.0 rule)
   * @throws 404 if comment not found
   * @throws 401 if unauthorized
   */
  deleteComment: async (recipeId: string, commentId: string): Promise<void> => {
    await api.delete(`/recipes/${recipeId}/comments/${commentId}`);
  },
};

// Helper function to normalize comment data from API
function normalizeComment(data: any): Comment {
  return {
    id: data.id?.toString() || data.comment_id?.toString() || '',
    recipeId: data.recipe_id?.toString() || data.recipeId?.toString() || '',
    userId: data.user_id?.toString() || data.userId?.toString() || '',
    user: data.user
      ? {
          id: data.user.id?.toString() || '',
          username: data.user.username || 'Anonymous',
          avatar: data.user.avatar,
        }
      : undefined,
    content: data.content || '',
    rating: data.rating || 0,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  };
}
