import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { ImageService } from '../../lib/services/imageService';

interface GalaxyImagesProps {
  galaxyId: string;
  initialImages: any[];
}

export const GalaxyImages: React.FC<GalaxyImagesProps> = ({ galaxyId, initialImages }) => {
  const [images, setImages] = useState(initialImages);
  const [contrastIndex, setContrastIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const contrastOptions = ImageService.getContrastOptions();

  const handleContrastChange = useCallback(async () => {
    setLoading(true);
    const newIndex = (contrastIndex + 1) % contrastOptions.vmaxPercentiles.length;
    setContrastIndex(newIndex);

    const vmax = contrastOptions.vmaxPercentiles[newIndex];
    const vmaxRaw = contrastOptions.vmaxRawPercentiles[newIndex];

    try {
      const response = await fetch(`/api/images/galaxy-set/${galaxyId}?vmax=${vmax}&vmaxRaw=${vmaxRaw}`);
      const newImages = await response.json();
      setImages(newImages);
    } catch (error) {
      console.error('Error updating contrast:', error);
    } finally {
      setLoading(false);
    }
  }, [contrastIndex, galaxyId, contrastOptions]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Galaxy Images</h3>
        <Button 
          onClick={handleContrastChange} 
          disabled={loading}
          variant="secondary"
        >
          {loading ? 'Updating...' : 'Contrast'}
        </Button>
      </div>

      {/* First row - 3 images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {images.slice(0, 3).map((image, index) => (
          <ImageCard key={`${image.baseName}-${contrastIndex}`} image={image} />
        ))}
      </div>

      {/* Second row - remaining images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {images.slice(3).map((image, index) => (
          <ImageCard key={`${image.baseName}-${contrastIndex}`} image={image} />
        ))}
      </div>
    </div>
  );
};

const ImageCard: React.FC<{ image: any }> = ({ image }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">{image.title}</h4>
          {image.vmax && (
            <span className="text-xs text-gray-500">
              ({image.vmax.toFixed(1)})
            </span>
          )}
        </div>
      </div>
      <div className="aspect-square relative">
        <img
          src={image.path}
          alt={image.title}
          className="w-full h-full object-cover cursor-crosshair"
          loading="lazy"
        />
      </div>
    </div>
  );
};
