import { useEffect } from 'react';

export const useImagePreload = (imageSrcs: string[], priority: boolean = false) => {
  useEffect(() => {
    if (!priority) return;

    // Preload critical images
    imageSrcs.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    return () => {
      // Cleanup preload links
      const preloadLinks = document.querySelectorAll(`link[rel="preload"][as="image"]`);
      preloadLinks.forEach(link => {
        if (imageSrcs.includes((link as HTMLLinkElement).href)) {
          link.remove();
        }
      });
    };
  }, [imageSrcs, priority]);
};
