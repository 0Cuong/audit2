import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function Avatar({ src, alt, className = '', fallback }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null | undefined>(src);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(!!src);
    setCurrentSrc(src);
  }, [src]);

  const handleError = () => {
    // If xnghi.jpg fails, try xuannghi.jpg
    if (currentSrc === '/xnghi.jpg') {
      setCurrentSrc('/xuannghi.jpg');
      return;
    }
    if (currentSrc === '/xuannghi.jpg') {
      setCurrentSrc('/xnghi.jpg');
      return;
    }
    setHasError(true);
    setIsLoading(false);
  };

  const showFallback = !currentSrc || hasError;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-zinc-800 shrink-0 ${className}`}>
      {showFallback ? (
        fallback || (
          <span className="text-zinc-400 font-medium tracking-widest text-sm select-none">
            {alt ? getInitials(alt) : <User className="w-1/2 h-1/2 opacity-50" />}
          </span>
        )
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center animate-pulse">
              <span className="text-zinc-500/50 font-medium tracking-widest text-sm select-none">
                {alt ? getInitials(alt) : null}
              </span>
            </div>
          )}
          <img
            src={currentSrc}
            alt={alt || 'Avatar'}
            onLoad={() => setIsLoading(false)}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        </>
      )}
    </div>
  );
}
