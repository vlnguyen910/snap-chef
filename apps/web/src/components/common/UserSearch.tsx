import React, { useState, useEffect, useRef } from 'react';

interface UserSearchProps {
  onSelectUser?: (userId: string, username: string) => void;
  placeholder?: string;
  className?: string;
}

interface UserResult {
  id: string;
  username: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * User Search Component
 * Search bar with dropdown for searching users
 * TODO: Connect to actual user search API when available
 */
export const UserSearch: React.FC<UserSearchProps> = ({
  onSelectUser,
  placeholder = 'Search for users...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users (debounced)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        // const results = await userService.searchUsers(query);
        
        // Mock data for now
        const mockResults: UserResult[] = [
          {
            id: '1',
            username: 'john_doe',
            firstName: 'John',
            lastName: 'Doe',
            avatar: undefined,
          },
          {
            id: '2',
            username: 'jane_smith',
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: undefined,
          },
        ].filter((user) => user.username.toLowerCase().includes(query.toLowerCase()));

        setResults(mockResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Failed to search users:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = (user: UserResult) => {
    if (onSelectUser) {
      onSelectUser(user.id, user.username);
    }
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-600">
                    {user.username[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">@{user.username}</p>
                {user.firstName && user.lastName && (
                  <p className="text-sm text-gray-500 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
};
