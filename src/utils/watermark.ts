/**
 * Add watermark to images using Canvas API
 */

export interface WatermarkOptions {
  logoUrl: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  opacity?: number;
  logoSize?: number; // percentage of image width (0-100)
  padding?: number; // padding from edges in pixels
}

/**
 * Load an image from URL and return as HTMLImageElement
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Calculate logo position on canvas
 */
const calculatePosition = (
  canvasWidth: number,
  canvasHeight: number,
  logoWidth: number,
  logoHeight: number,
  position: string,
  padding: number
): { x: number; y: number } => {
  switch (position) {
    case 'bottom-right':
      return {
        x: canvasWidth - logoWidth - padding,
        y: canvasHeight - logoHeight - padding
      };
    case 'bottom-left':
      return {
        x: padding,
        y: canvasHeight - logoHeight - padding
      };
    case 'top-right':
      return {
        x: canvasWidth - logoWidth - padding,
        y: padding
      };
    case 'top-left':
      return {
        x: padding,
        y: padding
      };
    case 'center':
      return {
        x: (canvasWidth - logoWidth) / 2,
        y: (canvasHeight - logoHeight) / 2
      };
    default:
      return {
        x: canvasWidth - logoWidth - padding,
        y: canvasHeight - logoHeight - padding
      };
  }
};

/**
 * Add watermark to an image
 * @param imageData - Base64 data URL or blob URL of the image
 * @param options - Watermark configuration options
 * @returns Base64 data URL of the watermarked image
 */
export const addWatermark = async (
  imageData: string,
  options: WatermarkOptions
): Promise<string> => {
  const {
    logoUrl,
    position = 'bottom-right',
    opacity = 0.9,
    logoSize = 15, // 15% of image width
    padding = 20
  } = options;

  try {
    // Load both the main image and the logo
    const [mainImage, logoImage] = await Promise.all([
      loadImage(imageData),
      loadImage(logoUrl)
    ]);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw the main image
    ctx.drawImage(mainImage, 0, 0);

    // Calculate logo dimensions (maintain aspect ratio)
    const logoTargetWidth = Math.floor(mainImage.width * (logoSize / 100));
    const logoAspectRatio = logoImage.width / logoImage.height;
    const logoTargetHeight = Math.floor(logoTargetWidth / logoAspectRatio);

    // Calculate logo position
    const { x, y } = calculatePosition(
      canvas.width,
      canvas.height,
      logoTargetWidth,
      logoTargetHeight,
      position,
      padding
    );

    // Set opacity and draw logo
    ctx.globalAlpha = opacity;
    ctx.drawImage(logoImage, x, y, logoTargetWidth, logoTargetHeight);

    // Reset opacity
    ctx.globalAlpha = 1.0;

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
};

/**
 * Add watermark to a File object
 * @param file - Image file
 * @param options - Watermark configuration options
 * @returns Base64 data URL of the watermarked image
 */
export const addWatermarkToFile = async (
  file: File,
  options: WatermarkOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imageData = reader.result as string;
        const watermarked = await addWatermark(imageData, options);
        resolve(watermarked);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
