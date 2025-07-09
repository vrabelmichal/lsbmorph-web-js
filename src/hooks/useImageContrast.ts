import { useState, useCallback, useEffect } from 'react';

interface GalaxyImage {
  path: string;
  title: string;
  baseName: string;
  success: boolean;
  vmax?: number;
}

export const useImageContrast = (galaxyId: string, initialImages: GalaxyImage[]) => {
  const [images, setImages] = useState(initialImages);
  const [contrastIndex, setContrastIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const contrastOptions = {
    vmaxPercentiles: [99.0, 99.5, 99.9, 99.95, 80.0, 90.0],
    vmaxRawPercentiles: [99.7, 99.7, 99.9, 99.95, 90.0, 99.0]
  };

  const handleContrastChange = useCallback(async () => {
    setLoading(true);
    const newIndex = (contrastIndex + 1) % contrastOptions.vmaxPercentiles.length;
    setContrastIndex(newIndex);

    const vmax = contrastOptions.vmaxPercentiles[newIndex];
    const vmaxRaw = contrastOptions.vmaxRawPercentiles[newIndex];

    try {
      // Update image URLs with new contrast values
      const updatedImages = images.map(image => {
        const newPath = updateImagePath(image.path, image.baseName, vmax, vmaxRaw);
        const newVmax = getExpectedVmax(image.baseName, vmax, vmaxRaw);
        
        return {
          ...image,
          path: newPath,
          vmax: newVmax
        };
      });

      setImages(updatedImages);
    } catch (error) {
      console.error('Error updating contrast:', error);
    } finally {
      setLoading(false);
    }
  }, [contrastIndex, images, contrastOptions]);

  // Listen for keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        // Only trigger if not in an input field
        if (!(e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/)) {
          e.preventDefault();
          handleContrastChange();
        }
      }
    };

    const handleCustomEvent = () => {
      handleContrastChange();
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('contrastToggle', handleCustomEvent);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('contrastToggle', handleCustomEvent);
    };
  }, [handleContrastChange]);

  return {
    images,
    contrastIndex,
    loading,
    handleContrastChange,
    currentVmax: contrastOptions.vmaxPercentiles[contrastIndex],
    currentVmaxRaw: contrastOptions.vmaxRawPercentiles[contrastIndex]
  };
};

function updateImagePath(currentPath: string, baseName: string, vmax: number, vmaxRaw: number): string {
  const slugify = (value: number) => 
    value.toFixed(Math.abs(value % 1) < 0.05 ? 1 : 2)
      .replace(/-/g, 'm')
      .replace(/\./g, 'p');

  // Extract galaxy ID from current path
  const pathParts = currentPath.split('/');
  const galaxyId = pathParts[pathParts.length - 2];

  let newFilename: string;
  if (['masked_r_band', 'galfit_model', 'residual'].includes(baseName)) {
    newFilename = `${baseName}_vmax${slugify(vmax)}.png`;
  } else if (baseName === 'raw_r_band') {
    newFilename = `${baseName}_vmax${slugify(vmaxRaw)}.png`;
  } else {
    newFilename = `${baseName}.png`;
  }

  return `/api/images/galaxy/${galaxyId}/${newFilename}`;
}

function getExpectedVmax(baseName: string, vmax: number, vmaxRaw: number): number | null {
  if (['masked_r_band', 'galfit_model', 'residual'].includes(baseName)) {
    return vmax;
  }
  if (baseName === 'raw_r_band') {
    return vmaxRaw;
  }
  return null;
}
