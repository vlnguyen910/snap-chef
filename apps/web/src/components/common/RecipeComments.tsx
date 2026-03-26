import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { commentService } from "@/services/commentService";
import { CommentForm } from "../common/CommentForm";
import { StarRating } from "../common/StarRating";
import { useStore } from "@/lib/store";
import { toast } from "@/lib/toast-store";
import Swal from "sweetalert2";
import { MessageCircle, ThumbsUp } from "lucide-react";
import type {
  Comment,
  CreateCommentPayload,
  UpdateCommentPayload,
} from "@/types";

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
export const RecipeComments: React.FC<RecipeCommentsProps> = ({
  recipeOwnerId,
}) => {
  const { id: recipeId } = useParams<{ id: string }>();
  const user = useStore((state) => state.user);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
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
        console.error("Failed to fetch comments:", error);

        // Set error state to prevent retries
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load comments";
        setError(errorMessage);

        // Log detailed error for debugging
        console.error("Error details:", {
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
      console.error("Failed to fetch comments:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load comments";
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
      title: "Delete Comment?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await commentService.deleteComment(recipeId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted successfully");
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Comment not found");
      } else if (error.response?.status === 401) {
        toast.error("You are not authorized to delete this comment");
      } else {
        toast.error("Failed to delete comment");
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
    setEditContent("");
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
      alert("Failed to update comment");
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
    <div className="rounded-xl border border-slate-200 bg-card p-6 dark:border-slate-800">
      <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
        Comments &amp; Reviews
      </h2>

      {/* Comment Form - ONLY show if user is logged in */}
      {user ? (
        <CommentForm onSubmit={handleCreateComment} isLoading={isSubmitting} />
      ) : (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="font-medium text-primary">
            Please <a href="/auth/signin">log in</a> to join the discussion
          </p>
        </div>
      )}

      {/* Comments List - ALWAYS visible, regardless of login status */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h3>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500">
            Loading comments...
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="mb-2 text-red-500">{error}</p>
            <button
              onClick={fetchComments}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-slate-200 bg-background p-4 dark:border-slate-800"
            >
              {/* Comment Header */}
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    {comment.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {comment.user?.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {comment.user?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {canEditComment(comment) && (
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-sm font-medium text-red-500 hover:underline"
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
                  <StarRating
                    value={editRating}
                    onChange={setEditRating}
                    size="md"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      className="rounded-md bg-primary px-4 py-1 text-sm text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-md bg-slate-200 px-4 py-1 text-sm text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {comment.content}
                  </p>
                  <div className="mt-3 flex gap-4">
                    <button className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary">
                      <ThumbsUp className="size-3.5" />
                      Helpful
                    </button>
                    <button className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary">
                      <MessageCircle className="size-3.5" />
                      Reply
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
