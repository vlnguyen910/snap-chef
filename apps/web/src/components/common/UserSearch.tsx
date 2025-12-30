import { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useSearchUsers } from '@/hooks/useUser';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchUserResult } from '@/types';
import { useNavigate } from 'react-router-dom';

interface UserSearchProps {
  onSelectUser?: (user: SearchUserResult) => void;
  placeholder?: string;
  className?: string;
}

export default function UserSearch({ 
  onSelectUser, 
  placeholder = 'Search users...',
  className = ''
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  const { data: users = [], isLoading, error } = useSearchUsers(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleUserClick = (user: SearchUserResult) => {
    // Navigate to user profile page
    navigate(`/users/${user.id}/profile`);
    
    if (onSelectUser) {
      onSelectUser(user);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Results */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-red-600">
                Failed to search users. Please try again.
              </div>
            ) : users.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No users found for "{searchQuery}"
              </div>
            ) : (
              <div className="py-2">
                {users.map((user: SearchUserResult) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors cursor-pointer"
                  >
                    {/* Avatar */}
                    <img 
                      src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username} 
                      alt={user.username}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username;
                      }}
                    />
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
