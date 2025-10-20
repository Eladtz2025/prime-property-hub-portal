
import React, { useCallback, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Star, StarOff, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { PropertyImage } from '../types/property';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  images: PropertyImage[];
  onImagesChange: (images: PropertyImage[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in MB
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizePerImage = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const compressImage = (file: File, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: PropertyImage[] = [];
    
    for (let i = 0; i < files.length && (images.length + newImages.length) < maxImages; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "שגיאה",
          description: `הקובץ ${file.name} אינו תמונה`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSizePerImage * 1024 * 1024) {
        toast({
          title: "שגיאה",
          description: `הקובץ ${file.name} גדול מדי (מקסימום ${maxSizePerImage}MB)`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const compressedDataUrl = await compressImage(file);
        
        // Add watermark
        let finalDataUrl = compressedDataUrl;
        try {
          const { data: watermarkData, error: watermarkError } = await supabase.functions.invoke('add-watermark-on-upload', {
            body: {
              imageData: compressedDataUrl,
              logoUrl: 'https://jswumsdymlooeobrxict.supabase.co/storage/v1/object/public/property-images/city-market-logo.png',
              position: 'bottom-right',
              opacity: 0.9
            }
          });

          if (watermarkError) {
            console.error('Watermark error:', watermarkError);
            logger.error('Watermark failed, using original image', watermarkError, 'ImageUpload');
          } else if (watermarkData?.watermarkedImage) {
            finalDataUrl = watermarkData.watermarkedImage;
            console.log('✅ Watermark applied successfully');
          }
        } catch (watermarkError) {
          console.error('Watermark exception:', watermarkError);
          logger.error('Watermark exception, using original image', watermarkError, 'ImageUpload');
        }
        
        const newImage: PropertyImage = {
          id: `img_${Date.now()}_${i}`,
          name: file.name,
          url: finalDataUrl,
          isPrimary: images.length === 0 && newImages.length === 0,
          uploadedAt: new Date().toISOString(),
          size: file.size
        };

        newImages.push(newImage);
      } catch (error) {
        logger.error('Error compressing image:', error, 'ImageUpload');
        toast({
          title: "שגיאה",
          description: `לא הצלחנו לעבד את התמונה ${file.name}`,
          variant: "destructive",
        });
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast({
        title: "הצלחה",
        description: `${newImages.length} תמונות נוספו בהצלחה`,
      });
    }
  }, [images, onImagesChange, maxImages, maxSizePerImage, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // If we removed the primary image, make the first remaining image primary
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }
    
    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground mb-4">
            גרור תמונות לכאן או לחץ לבחירת קבצים
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={images.length >= maxImages}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            בחר תמונות ({images.length}/{maxImages})
          </Button>
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover rounded"
                  />
                  
                  {/* Primary indicator */}
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                      ראשית
                    </div>
                  )}
                  
                  {/* Controls */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImage(image.id)}
                      className="h-6 w-6 p-0"
                    >
                      {image.isPrimary ? (
                        <Star className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <StarOff className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(image.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {image.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
