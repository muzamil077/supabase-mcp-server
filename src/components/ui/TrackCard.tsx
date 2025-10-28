import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './card';
import {
  FaClock,
  FaHeart
} from 'react-icons/fa';
import { ITrack } from '@/types';
import { getImageUrl, cn } from '@/utils';
import { getTrackLikes, incrementTrackLikes } from '@/services/LikesAPI';
import { useAuth } from '@/context/authContext';

interface TrackCardProps {
  track: ITrack;
  category: string;
  isPlaying?: boolean;
  onPlay?: (track: ITrack) => void;
  variant?: 'compact' | 'detailed' | 'featured';
  className?: string;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  category: _category,
  isPlaying: _isPlayingProp,
  onPlay,
  variant = 'detailed',
  className
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);

  const { poster_path, original_title: title, name, artist, album, duration } = track;

  // Fetch initial likes count
  useEffect(() => {
    const fetchLikes = async () => {
      const count = await getTrackLikes(track.id);
      setLikesCount(count);
    };
    fetchLikes();
  }, [track.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    
    if (isLoadingLikes) return;

    // Check if user is authenticated
    if (!user) {
      // Redirect to sign up page
      navigate('/register');
      return;
    }

    try {
      setIsLoadingLikes(true);
      const newCount = await incrementTrackLikes(track.id);
      setLikesCount(newCount);
      setIsLiked(true);
    } catch (error) {
      console.error('Error liking track:', error);
    } finally {
      setIsLoadingLikes(false);
    }
  };
  const displayTitle = title || name || 'Unknown Track';

  const formatDuration = (ms: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  const cardHeight = variant === 'compact' ? 'h-52' : variant === 'featured' ? 'h-84' : 'h-80';
  const imageHeight = variant === 'compact' ? 160 : variant === 'featured' ? 240 : 200;

  const handleCardClick = () => {
    if (onPlay) {
      onPlay(track);
    }
  };

  return (
    <Card 
      className={cn(
        "group relative transition-all duration-300 ease-out overflow-hidden",
        "hover:scale-[1.03] hover:-translate-y-2 cursor-pointer",
        "bg-white dark:bg-card-dark border-0",
        "shadow-sm hover:shadow-card-hover",
        "rounded-xl p-4",
        cardHeight,
        "w-[180px]", // Slightly wider for better proportions
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Content */}
      <div className="block relative h-full">
        {/* Image Container */}
        <div className="relative overflow-hidden rounded-lg mb-3">
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-hover-gray animate-pulse rounded-lg" 
                 style={{ height: imageHeight }} />
          )}
          
          {/* Album artwork */}
          <img
            src={getImageUrl(poster_path)}
            alt={displayTitle}
            className={cn(
              "w-full object-cover transition-all duration-300 rounded-lg",
              "group-hover:scale-105",
              "dark:brightness-75 dark:contrast-110 dark:saturate-90",
              "dark:group-hover:brightness-90 dark:group-hover:contrast-105 dark:group-hover:saturate-95",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            style={{ height: imageHeight }}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Gradient overlay on hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 rounded-lg",
            isHovered ? "opacity-100" : "opacity-0"
          )} />

          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLoadingLikes}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-200",
              "bg-white/20 backdrop-blur-sm hover:bg-white/30",
              "hover:scale-110 active:scale-95",
              isLiked && "text-red-500",
              !user && "hover:bg-accent-orange/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title={user ? "Like this track" : "Sign up to like this track"}
          >
            <FaHeart className={cn(
              "w-4 h-4 transition-all duration-200",
              isLiked && "fill-red-500 text-red-500"
            )} />
          </button>

          {/* Likes count */}
          {likesCount > 0 && (
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
              {likesCount}
            </div>
          )}
        </div>

        {/* Track information */}
        <CardContent className="p-0 space-y-2">
          {/* Track title */}
          <h3 className={cn(
            "font-semibold text-gray-900 dark:text-text-primary truncate transition-colors duration-200",
            variant === 'compact' ? "text-sm" : "text-base",
            "group-hover:text-accent-orange dark:group-hover:text-accent-orange"
          )}>
            {displayTitle}
          </h3>
          
          {/* Artist name */}
          <p className={cn(
            "text-gray-600 dark:text-text-secondary truncate font-medium",
            variant === 'compact' ? "text-xs" : "text-sm"
          )}>
            {artist || 'Unknown Artist'}
          </p>

          {/* Additional info for detailed variant */}
          {variant === 'detailed' && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2 flex-1 mr-2">
                {album && (
                  <span className="text-xs text-text-muted dark:text-text-secondary/70 truncate">
                    {album}
                  </span>
                )}
              </div>
              {duration && (
                <div className="flex items-center text-xs text-text-muted dark:text-text-secondary/70 shrink-0">
                  <FaClock className="w-3 h-3 mr-1 opacity-60" />
                  {formatDuration(duration)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Hover glow effect */}
      <div className={cn(
        "absolute -inset-1 bg-gradient-to-r from-spotify-green via-accent-orange to-warning-amber rounded-2xl opacity-0 transition-opacity duration-500 -z-10 blur-md",
        "dark:bg-gradient-to-r dark:from-blue-800 dark:via-slate-600 dark:to-blue-800",
        isHovered && "opacity-10"
      )} />
    </Card>
  );
};