/**
 * Utility functions for adding watermarks to images
 */

export interface WatermarkOptions {
  logoUrl: string;
  opacity?: number;
  logoWidth?: number; // percentage of image width
  offsetX?: number; // pixels from right
  offsetY?: number; // pixels from bottom
}

/**
 * Add watermark to an image file
 * @param imageFile - The original image file
 * @param options - Watermark configuration options
 * @returns Promise<Blob> - The watermarked image as a blob
 */
export async function addWatermarkToImage(
  imageFile: File,
  options: WatermarkOptions
): Promise<Blob> {
  const {
    logoUrl,
    opacity = 0.4,
    logoWidth = 15,
    offsetX = 20,
    offsetY = 20
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Load the logo first
    const logoImage = new Image();
    logoImage.crossOrigin = 'anonymous';
    
    logoImage.onload = () => {
      // Now load the main image
      const mainImage = new Image();
      
      const handleMainImageLoad = () => {
        // Set canvas size to match image
        canvas.width = mainImage.width;
        canvas.height = mainImage.height;

        // Draw the main image
        ctx.drawImage(mainImage, 0, 0);

        // Calculate logo dimensions
        const logoWidthPx = (canvas.width * logoWidth) / 100;
        const logoHeightPx = (logoImage.height / logoImage.width) * logoWidthPx;

        // Calculate position (bottom-right corner)
        const x = canvas.width - logoWidthPx - offsetX;
        const y = canvas.height - logoHeightPx - offsetY;

        // Set opacity
        ctx.globalAlpha = opacity;

        // Draw the logo
        ctx.drawImage(logoImage, x, y, logoWidthPx, logoHeightPx);

        // Reset opacity
        ctx.globalAlpha = 1.0;

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create watermarked image'));
            }
          },
          'image/jpeg',
          0.92
        );
      };

      const handleMainImageError = (error: any) => {
        console.error('Failed to load main image:', error);
        reject(new Error('Failed to load main image'));
      };

      mainImage.onload = handleMainImageLoad;
      mainImage.onerror = handleMainImageError;

      // Create object URL from file
      mainImage.src = URL.createObjectURL(imageFile);
    };

    logoImage.onerror = (error) => {
      console.error('Failed to load logo image:', error);
      reject(new Error('Failed to load logo image'));
    };

    logoImage.src = logoUrl;
  });
}

/**
 * Add watermark to an image from URL
 * @param imageUrl - The URL of the original image
 * @param options - Watermark configuration options
 * @returns Promise<Blob> - The watermarked image as a blob
 */
export async function addWatermarkToImageUrl(
  imageUrl: string,
  options: WatermarkOptions
): Promise<Blob> {
  // Fetch the image as a blob first
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
  
  return addWatermarkToImage(file, options);
}
