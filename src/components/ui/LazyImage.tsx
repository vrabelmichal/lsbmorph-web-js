import React, { useState, useCallback } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // For above-the-fold images
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  priority = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { ref, shouldLoad } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Start loading earlier for smoother UX
    triggerOnce: true,
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  const handleStartLoading = useCallback(() => {
    if (!isLoading && !isLoaded && !hasError) {
      setIsLoading(true);
    }
  }, [isLoading, isLoaded, hasError]);

  // Load immediately if priority or when in viewport
  const shouldStartLoading = priority || shouldLoad;

  React.useEffect(() => {
    if (shouldStartLoading && !isLoading && !isLoaded && !hasError) {
      handleStartLoading();
    }
  }, [shouldStartLoading, handleStartLoading, isLoading, isLoaded, hasError]);

  const defaultPlaceholder = (
    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">
        {isLoading ? 'Loading...' : 'Image'}
      </div>
    </div>
  );

  const errorPlaceholder = (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Failed to load</div>
    </div>
  );

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {hasError ? (
        errorPlaceholder
      ) : !isLoaded ? (
        placeholder || defaultPlaceholder
      ) : null}
      
      {shouldStartLoading && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
          loading="lazy"
        />
      )}
    </div>
  );
};
