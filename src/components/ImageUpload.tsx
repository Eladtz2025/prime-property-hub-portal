
import React, { useCallback, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Star, StarOff, Image as ImageIcon, MoveUp, MoveDown, Video, Play, Eye, EyeOff, Sofa, Wand2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { PhotoStudioDialog } from './photo-studio/PhotoStudioDialog';
import { PropertyImage } from '../types/property';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  maxSizePerImage = 20 // Increased to 20MB for mobile photos
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [studioImage, setStudioImage] = useState<PropertyImage | null>(null);
  const { toast } = useToast();

  // Upload video directly to Supabase Storage
  const uploadVideo = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600'
      });

    if (error) {
      logger.error('Video upload error:', error, 'ImageUpload');
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Convert HEIC to JPEG, compress, and upload to Supabase Storage
  const processAndUploadImage = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = async () => {
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob instead of data URL
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }

          try {
            // Upload to Supabase Storage
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const { data, error } = await supabase.storage
              .from('property-images')
              .upload(fileName, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600'
              });

            if (error) {
              logger.error('Upload error:', error, 'ImageUpload');
              reject(error);
              return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('property-images')
              .getPublicUrl(fileName);

            resolve(publicUrl);
          } catch (error) {
            logger.error('Storage error:', error, 'ImageUpload');
            reject(error);
          }
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Create object URL for the file (works with HEIC on iOS)
      img.src = URL.createObjectURL(file);
    });
  };

  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/') || 
           file.name.toLowerCase().match(/\.(mp4|mov|webm|avi)$/) !== null;
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const newImages: PropertyImage[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < files.length && (images.length + newImages.length) < maxImages; i++) {
      const file = files[i];
      const isVideo = isVideoFile(file);
      
      // Accept all common image formats including HEIC and video formats
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
      const isValidImageType = validImageTypes.some(type => file.type === type) || 
                          file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic|heif)$/);
      const isValidVideoType = validVideoTypes.some(type => file.type === type) || 
                          file.name.toLowerCase().match(/\.(mp4|mov|webm|avi)$/);
      
      if (!isValidImageType && !isValidVideoType) {
        errors.push(`${file.name} - פורמט לא נתמך`);
        continue;
      }

      const maxSize = isVideo ? 100 : maxSizePerImage; // 100MB for videos
      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name} - גדול מדי (מקסימום ${maxSize}MB)`);
        continue;
      }

      try {
        let fileUrl: string;
        if (isVideo) {
          fileUrl = await uploadVideo(file);
        } else {
          fileUrl = await processAndUploadImage(file);
        }
        
        const newImage: PropertyImage = {
          id: `${isVideo ? 'vid' : 'img'}_${Date.now()}_${i}`,
          name: file.name,
          url: fileUrl,
          isPrimary: images.length === 0 && newImages.length === 0 && !isVideo,
          uploadedAt: new Date().toISOString(),
          size: file.size,
          mediaType: isVideo ? 'video' : 'image',
          showOnWebsite: true
        };

        newImages.push(newImage);
      } catch (error) {
        logger.error('Error processing file:', error, 'ImageUpload');
        errors.push(`${file.name} - שגיאה בהעלאה`);
      }
    }

    setIsCompressing(false);

    if (errors.length > 0) {
      toast({
        title: "שגיאות בהעלאה",
        description: errors.join('\n'),
        variant: "destructive",
      });
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      const videoCount = newImages.filter(img => img.mediaType === 'video').length;
      const imageCount = newImages.length - videoCount;
      const parts = [];
      if (imageCount > 0) parts.push(`${imageCount} תמונות`);
      if (videoCount > 0) parts.push(`${videoCount} סרטונים`);
      toast({
        title: "הצלחה",
        description: `${parts.join(' ו-')} נוספו בהצלחה`,
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

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onImagesChange(newImages);
  };

  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onImagesChange(newImages);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over.id);
      
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
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
          {isCompressing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-center text-muted-foreground">
                מעבד קבצים...
              </p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-2 text-sm md:text-base">
                גרור תמונות או סרטונים לכאן
              </p>
              <p className="text-xs text-muted-foreground/70 mb-4">
                תמונות: HEIC, JPEG, PNG, WebP (עד {maxSizePerImage}MB) | סרטונים: MP4, MOV, WebM (עד 100MB)
              </p>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,video/x-msvideo,video/*,.mov,.MOV,.mp4,.MP4,.webm,.avi"
                capture="environment"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={images.length >= maxImages}
                className="w-full md:w-auto"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                בחר תמונות או סרטונים ({images.length}/{maxImages})
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  index={index}
                  totalImages={images.length}
                  onRemove={removeImage}
                  onSetPrimary={setPrimaryImage}
                  onMoveUp={moveImageUp}
                  onMoveDown={moveImageDown}
                  onToggleWebsite={(id) => {
                    const updatedImages = images.map(img => 
                      img.id === id ? { ...img, showOnWebsite: !(img.showOnWebsite ?? true) } : img
                    );
                    onImagesChange(updatedImages);
                  }}
                  onToggleFurnished={(id) => {
                    const updatedImages = images.map(img => 
                      img.id === id ? { ...img, isFurnished: !img.isFurnished } : img
                    );
                    onImagesChange(updatedImages);
                  }}
                  onEditInStudio={(img) => setStudioImage(img)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Photo Studio Dialog */}
      {studioImage && (
        <PhotoStudioDialog
          open={!!studioImage}
          onOpenChange={(open) => !open && setStudioImage(null)}
          imageUrl={studioImage.url}
          onImageReplace={(newUrl) => {
            const updatedImages = images.map(img =>
              img.id === studioImage.id ? { ...img, url: newUrl } : img
            );
            onImagesChange(updatedImages);
            setStudioImage(null);
          }}
        />
      )}
    </div>
  );
};

interface SortableImageCardProps {
  image: PropertyImage;
  index: number;
  totalImages: number;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleWebsite: (id: string) => void;
  onToggleFurnished: (id: string) => void;
  onEditInStudio: (image: PropertyImage) => void;
}

const SortableImageCard: React.FC<SortableImageCardProps> = ({
  image,
  index,
  totalImages,
  onRemove,
  onSetPrimary,
  onMoveUp,
  onMoveDown,
  onToggleWebsite,
  onToggleFurnished,
  onEditInStudio,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVideo = image.mediaType === 'video';
  const isHidden = image.showOnWebsite === false;
  const isFurnished = image.isFurnished === true;

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`relative group cursor-move ${isHidden ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-2">
        <div 
          className="relative aspect-square"
          {...attributes}
          {...listeners}
        >
          {isVideo ? (
            <div className={`w-full h-full bg-muted rounded flex items-center justify-center relative ${isHidden ? 'grayscale' : ''}`}>
              <video
                src={image.url}
                className="w-full h-full object-cover rounded"
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
          ) : (
            <img
              src={image.url}
              alt={image.name}
              className={`w-full h-full object-cover rounded ${isHidden ? 'grayscale' : ''}`}
            />
          )}
          
          {/* Video/Primary/Hidden indicator */}
          {isHidden && (
            <div className="absolute top-1 left-1 bg-gray-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              פנימי
            </div>
          )}
          {!isHidden && isVideo && (
            <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Video className="h-3 w-3" />
              סרטון
            </div>
          )}
          {!isHidden && isFurnished && (
            <div className="absolute top-1 left-1 bg-orange-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Sofa className="h-3 w-3" />
              מרוהטת
            </div>
          )}
          {!isHidden && image.isPrimary && !isVideo && !isFurnished && (
            <div className="absolute top-1 left-1 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
              ראשית
            </div>
          )}
          
          {/* Always-visible furnished button */}
          {!isVideo && (
            <div className="absolute top-1 right-1 z-10">
              <Button
                size="sm"
                variant={isFurnished ? "default" : "secondary"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFurnished(image.id);
                }}
                className={`h-6 w-6 p-0 ${isFurnished ? '' : 'opacity-60 hover:opacity-100'}`}
                title={isFurnished ? "הסר סימון מרוהטת" : "סמן כמרוהטת"}
              >
                <Sofa className={`h-3 w-3 ${isFurnished ? 'text-orange-500' : ''}`} />
              </Button>
            </div>
          )}
          {/* Hover Controls */}
          <div className={`absolute ${!isVideo ? 'top-1 right-8' : 'top-1 right-1'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
            {!isVideo && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditInStudio(image);
                }}
                className="h-6 w-6 p-0"
                title="עריכה בסטודיו"
              >
                <Wand2 className="h-3 w-3 text-primary" />
              </Button>
            )}
            <Button
              size="sm"
              variant={isHidden ? "outline" : "secondary"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWebsite(image.id);
              }}
              className="h-6 w-6 p-0"
              title={isHidden ? "הצג באתר" : "הסתר מהאתר"}
            >
              {isHidden ? (
                <EyeOff className="h-3 w-3 text-gray-500" />
              ) : (
                <Eye className="h-3 w-3 text-green-500" />
              )}
            </Button>
            {!isVideo && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetPrimary(image.id);
                }}
                className="h-6 w-6 p-0"
              >
                {image.isPrimary ? (
                  <Star className="h-3 w-3 text-yellow-500" />
                ) : (
                  <StarOff className="h-3 w-3" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Reorder Buttons */}
          <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {index > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(index);
                }}
                className="h-6 w-6 p-0"
                title="הזז למעלה"
              >
                <MoveUp className="h-3 w-3" />
              </Button>
            )}
            {index < totalImages - 1 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(index);
                }}
                className="h-6 w-6 p-0"
                title="הזז למטה"
              >
                <MoveDown className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {image.name}
        </p>
      </CardContent>
    </Card>
  );
};
