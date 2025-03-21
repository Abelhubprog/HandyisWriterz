import React from 'react';
import { useInteractions } from '@/hooks/useInteractions';
import { Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LikesProps {
  serviceId: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Likes({ serviceId, showCount = true, size = 'md' }: LikesProps) {
  const { likeCount, isLiked, toggleLike, isLoading } = useInteractions(serviceId);
  const { user } = useAuth();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoading) {
      await toggleLike();
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-sm',
    md: 'h-10 px-3',
    lg: 'h-12 px-4 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 rounded-full
        ${sizeClasses[size]}
        ${isLiked ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}
        hover:bg-red-50 hover:text-red-600
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 ease-in-out
        transform hover:scale-105 active:scale-95
        relative
      `}
    >
      <div className="relative transition-transform duration-200">
        <Heart
          size={iconSizes[size]}
          className={`
            transition-all duration-200
            ${isLiked ? 'fill-current scale-110' : 'scale-100'}
          `}
        />
        
        {isLiked && (
          <div 
            className={`
              absolute inset-0 text-red-600
              animate-like-pulse
            `}
          >
            <Heart size={iconSizes[size]} className="fill-current" />
          </div>
        )}
      </div>

      {showCount && (
        <span 
          className={`
            min-w-[1.5em] text-center
            transition-all duration-200
            ${isLiked ? 'text-red-600' : 'text-gray-600'}
          `}
        >
          {likeCount}
        </span>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
          <div className="w-4 h-4 border-2 border-red-600 rounded-full border-t-transparent animate-spin" />
        </div>
      )}
    </button>
  );
}
