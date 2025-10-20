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

    // Convert image file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      console.log('Image converted to base64, length:', imageDataUrl?.length);
      
      if (!imageDataUrl) {
        reject(new Error('Failed to convert image to base64'));
        return;
      }
      
      // Load the main image first
      const mainImage = new Image();
      
      mainImage.onload = () => {
        console.log('Main image loaded successfully, dimensions:', mainImage.width, 'x', mainImage.height);
        
        // Now load the logo
        const logoImage = new Image();
        
        logoImage.onload = () => {
          console.log('Logo loaded successfully');
          try {
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
                  console.log('Watermark created successfully, size:', blob.size);
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create watermarked image'));
                }
              },
              'image/jpeg',
              0.92
            );
          } catch (error) {
            console.error('Error processing image:', error);
            reject(new Error('Error processing image: ' + (error as Error).message));
          }
        };

        logoImage.onerror = (error) => {
          console.error('Failed to load logo image:', logoUrl, error);
          reject(new Error('Failed to load logo image from: ' + logoUrl));
        };

        console.log('Loading logo from:', logoUrl);
        logoImage.src = logoUrl;
      };

      mainImage.onerror = (error) => {
        console.error('Failed to load main image:', error);
        reject(new Error('Failed to load main image'));
      };

      console.log('Loading main image...');
      mainImage.src = imageDataUrl;
    };

    reader.onerror = () => {
      console.error('Failed to read image file');
      reject(new Error('Failed to read image file'));
    };

    console.log('Starting to read image file...');
    reader.readAsDataURL(imageFile);
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
