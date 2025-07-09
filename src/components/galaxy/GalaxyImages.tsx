import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/Button';
import { LazyImage } from '../ui/LazyImage';
import { useResponsive } from '../../hooks/useResponsive';
import { useImageContrast } from '../../hooks/useImageContrast';

interface GalaxyImage {
  path: string;
  title: string;
  baseName: string;
  success: boolean;
  vmax?: number;
}

interface GalaxyImagesProps {
  galaxyId: string;
  initialImages: GalaxyImage[];
}

export const GalaxyImages: React.FC<GalaxyImagesProps> = ({ 
  galaxyId, 
  initialImages 
}) => {
  const { isMobile } = useResponsive();
  const { 
    images, 
    contrastIndex, 
    loading, 
    handleContrastChange 
  } = useImageContrast(galaxyId, initialImages);

  // Define image order based on screen size
  const orderedImages = useMemo(() => {
    if (isMobile) {
      // Mobile priority order: most important images first
      const mobileOrder = ['aplpy', 'lupton', 'masked_r_band', 'residual', 'raw_r_band', 'galfit_model'];
      return images.sort((a, b) => {
        const aIndex = mobileOrder.indexOf(a.baseName);
        const bIndex = mobileOrder.indexOf(b.baseName);
        return aIndex - bIndex;
      });
    }
    return images; // Keep original order on desktop
  }, [images, isMobile]);

  // Split images into rows
  const firstRowImages = orderedImages.slice(0, 3);
  const secondRowImages = orderedImages.slice(3);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Galaxy Images</h3>
        <Button 
          onClick={handleContrastChange} 
          disabled={loading}
          variant="secondary"
          size="sm"
        >
          {loading ? 'Updating...' : 'Contrast'}
        </Button>
      </div>

      {/* First row - prioritized for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {firstRowImages.map((image, index) => (
          <LazyImageCard 
            key={`${image.baseName}-${contrastIndex}`} 
            image={image}
            priority={index < 2} // First 2 images load immediately
          />
        ))}
      </div>

      {/* Second row - lazy loaded */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {secondRowImages.map((image) => (
          <LazyImageCard 
            key={`${image.baseName}-${contrastIndex}`} 
            image={image}
            priority={false}
          />
        ))}
      </div>
    </div>
  );
};

interface LazyImageCardProps {
  image: GalaxyImage;
  priority: boolean;
}

const LazyImageCard: React.FC<LazyImageCardProps> = ({ image, priority }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const placeholder = (
    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
      <div className="text-gray-500 text-xs">Loading {image.title}</div>
    </div>
  );

  const errorPlaceholder = (
    <div className="aspect-square bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center">
      <div className="text-red-400 text-sm mb-1">⚠</div>
      <div className="text-red-600 text-xs text-center px-2">
        Failed to load {image.title}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm truncate">{image.title}</h4>
          {image.vmax && (
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              ({image.vmax.toFixed(1)})
            </span>
          )}
        </div>
      </div>
      
      <LazyImage
        src={image.path}
        alt={image.title}
        className="w-full aspect-square object-cover cursor-crosshair"
        placeholder={imageError ? errorPlaceholder : placeholder}
        priority={priority}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      
      {/* Loading indicator overlay */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  );
};
