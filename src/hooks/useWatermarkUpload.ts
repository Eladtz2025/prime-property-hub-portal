import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addWatermarkToImage } from '@/utils/watermark';
import { toast } from 'sonner';
// Use logo from public folder instead of assets to avoid bundling issues
const logoUrl = '/images/city-market-logo.png';

export interface WatermarkUploadOptions {
  bucket: string;
  path: string;
  keepOriginal?: boolean;
  originalBucket?: string;
  originalPath?: string;
}

export const useWatermarkUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Upload an image with watermark
   * @param file - The image file to upload
   * @param options - Upload configuration
   * @returns The public URL of the uploaded watermarked image
   */
  const uploadWithWatermark = async (
    file: File,
    options: WatermarkUploadOptions
  ): Promise<string | null> => {
    const {
      bucket,
      path,
      keepOriginal = false,
      originalBucket = 'property-images-original',
      originalPath
    } = options;

    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: Save original if requested (20%)
      if (keepOriginal) {
        const origPath = originalPath || path;
        const { error: originalError } = await supabase.storage
          .from(originalBucket)
          .upload(origPath, file, { upsert: true });

        if (originalError) {
          throw new Error(`Failed to save original: ${originalError.message}`);
        }
        setProgress(20);
      }

      // Step 2: Add watermark (50%)
      const watermarkedBlob = await addWatermarkToImage(file, {
        logoUrl,
        opacity: 0.4,
        logoWidth: 15,
        offsetX: 20,
        offsetY: 20
      });
      setProgress(50);

      // Step 3: Upload watermarked image (80%)
      const watermarkedFile = new File(
        [watermarkedBlob],
        file.name,
        { type: 'image/jpeg' }
      );

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(path, watermarkedFile, { upsert: true });

      if (uploadError) {
        throw new Error(`Failed to upload watermarked image: ${uploadError.message}`);
      }

      setProgress(80);

      // Step 4: Get public URL (100%)
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      setProgress(100);
      toast.success('תמונה הועלתה בהצלחה עם watermark');
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading with watermark:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה');
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadWithWatermark,
    isUploading,
    progress
  };
};
