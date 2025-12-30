import React, { useState } from 'react';

interface BookmarkButtonProps {
  recipeId: string;
  initialSaved?: boolean;
  onToggle?: (recipeId: string, isSaved: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Bookmark Button Component
 * Displays a bookmark/save icon that toggles saved state
 * TODO: Connect to actual API when bookmark endpoint is available
 */
export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  recipeId,
  initialSaved = false,
  onToggle,
  size = 'md',
}) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleToggle = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Call actual bookmark API
      // if (isSaved) {
      //   await bookmarkService.removeBookmark(recipeId);
      // } else {
      //   await bookmarkService.addBookmark(recipeId);
      // }
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      if (onToggle) {
        onToggle(recipeId, newSavedState);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      alert('Failed to bookmark recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        p-2 rounded-full
        transition-all duration-200
        hover:bg-gray-100 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      aria-label={isSaved ? 'Remove bookmark' : 'Add bookmark'}
      title={isSaved ? 'Remove from saved' : 'Save recipe'}
    >
      {isSaved ? (
        // Filled bookmark icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-blue-600"
        >
          <path
            fillRule="evenodd"
            d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        // Outline bookmark icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="text-gray-600 hover:text-blue-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
      )}
    </button>
  );
};
