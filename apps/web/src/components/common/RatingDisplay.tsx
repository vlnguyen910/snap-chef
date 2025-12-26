import { Star } from 'lucide-react';

interface RatingDisplayProps {
  averageRating: number;
  ratingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function RatingDisplay({ 
  averageRating, 
  ratingCount = 0, 
  size = 'sm',
  showCount = true 
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  // Round to nearest 0.5 for display
  const roundedRating = Math.round(averageRating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;

  return (
    <div className="flex items-center gap-1.5">
      {/* Star Icons */}
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => {
          const starNumber = index + 1;
          
          if (starNumber <= fullStars) {
            // Full star
            return (
              <Star
                key={index}
                className={`${iconSize} text-yellow-500`}
                fill="currentColor"
              />
            );
          } else if (starNumber === fullStars + 1 && hasHalfStar) {
            // Half star
            return (
              <div key={index} className="relative">
                <Star className={`${iconSize} text-gray-300`} />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className={`${iconSize} text-yellow-500`} fill="currentColor" />
                </div>
              </div>
            );
          } else {
            // Empty star
            return (
              <Star
                key={index}
                className={`${iconSize} text-gray-300`}
              />
            );
          }
        })}
      </div>

      {/* Rating Number and Count */}
      <div className={`flex items-center gap-1 ${textSize}`}>
        <span className="font-semibold text-gray-900">
          {averageRating.toFixed(1)}
        </span>
        {showCount && ratingCount > 0 && (
          <span className="text-gray-500">
            ({ratingCount})
          </span>
        )}
      </div>
    </div>
  );
}
