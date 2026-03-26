import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { StarRating } from "../common/StarRating";
import type { CreateCommentPayload } from "@/types";

interface CommentFormProps {
  onSubmit: (payload: CreateCommentPayload) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Comment Form Component
 * Form to create a new comment with text input and star rating selector
 */
export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { id: recipeId } = useParams<{ id: string }>();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!content.trim()) {
      setError("Please enter a comment");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (rating < 0 || rating > 5 || !Number.isInteger(rating)) {
      setError("Rating must be an integer between 0 and 5");
      return;
    }

    if (!recipeId) {
      setError("Recipe ID is missing");
      return;
    }

    try {
      // Call parent onSubmit callback - parent will handle API call
      await onSubmit({
        content: content.trim(),
        rating: Math.floor(Number(rating)),
      });

      // Reset form on success
      setContent("");
      setRating(0);
    } catch (err: any) {
      console.error("❌ Error posting comment:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // Handle specific error codes
      if (err.response?.status === 401) {
        setError(
          "🔐 Unauthorized: You must be logged in. Please check your token.",
        );
      } else if (err.response?.status === 403) {
        setError(
          "🚫 Forbidden: Your session has expired. Please log in again.",
        );
      } else if (err.response?.status === 400) {
        setError(
          `❌ Bad Request: ${err.response?.data?.message || "Invalid comment data"}`,
        );
      } else if (err.response?.status === 500) {
        // ✅ User-friendly 500 error handling
        setError(
          "⚠️ System Error: You might have already commented on this recipe, or the server is busy. Please try again later.",
        );
        alert(
          "System Error: You might have already commented on this recipe, or the server is busy.",
        );
      } else {
        setError(err.message || "Failed to post comment. Please try again.");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-xl border border-slate-200 bg-background p-4 dark:border-slate-800"
    >
      <div>
        <label
          htmlFor="comment-rating"
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Your Rating
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label
          htmlFor="comment-content"
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Your Comment
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-800"
          placeholder="Share your thoughts about this recipe..."
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !content.trim() || rating === 0}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isLoading ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
};
