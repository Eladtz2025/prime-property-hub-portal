import { useState, useCallback } from 'react';

interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export const useImageOptimization = () => {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = useCallback(async (
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<File> => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = 'webp'
    } = options;

    setIsCompressing(true);

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });
              setIsCompressing(false);
              resolve(compressedFile);
            } else {
              setIsCompressing(false);
              reject(new Error('Compression failed'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        setIsCompressing(false);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  return {
    compressImage,
    isCompressing
  };
};