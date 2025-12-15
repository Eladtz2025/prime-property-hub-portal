import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Image as ImageIcon, Trash2, Download, Eye, Video, Play } from 'lucide-react';
import { addWatermarkToFile } from '@/utils/watermark';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PropertyWithTenant } from '@/types/owner-portal';

interface PropertyGalleryProps {
  properties: PropertyWithTenant[];
}

interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  alt_text: string | null;
  is_main: boolean | null;
  order_index: number | null;
  media_type?: string;
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({ properties }) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>(properties[0]?.id || '');
  const [uploading, setUploading] = useState(false);
  const [viewImage, setViewImage] = useState<PropertyImage | null>(null);
  const isSuperAdmin = profile?.role === 'super_admin';

  useEffect(() => {
    if (selectedProperty) {
      loadImages();
    }
  }, [selectedProperty]);

  const loadImages = async () => {
    if (!selectedProperty) return;
    
    setLoading(true);
    try {
      console.log('Loading images for property:', selectedProperty);
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', selectedProperty)
        .order('order_index', { ascending: true });

      console.log('Images loaded:', data, 'Error:', error);
      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את התמונות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/') || 
           file.name.toLowerCase().match(/\.(mp4|mov|webm|avi)$/) !== null;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      console.log('🔵 Starting upload for', files.length, 'files');
      console.log('🔵 Selected property:', selectedProperty);
      
      for (const file of Array.from(files)) {
        console.log('📤 Processing file:', file.name);
        const isVideo = isVideoFile(file);
        
        // Check file size limits (100MB for videos, 20MB for images)
        const maxSize = isVideo ? 100 : 20;
        if (file.size > maxSize * 1024 * 1024) {
          toast({
            title: 'קובץ גדול מדי',
            description: `${file.name} גדול מ-${maxSize}MB`,
            variant: 'destructive',
          });
          continue;
        }
        
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedProperty}/${Date.now()}.${fileExt}`;
        
        console.log('📤 Storage path:', fileName);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError);
          throw uploadError;
        }
        console.log('✅ Storage upload success:', uploadData);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        
        console.log('🔗 Public URL:', publicUrl);

        // Save to property_images table
        const insertData = {
          property_id: selectedProperty,
          image_url: publicUrl,
          alt_text: file.name,
          is_main: false,
          order_index: images.length + 1,
          media_type: isVideo ? 'video' : 'image',
        };
        
        console.log('💾 Inserting to DB:', insertData);
        const { data: dbData, error: dbError } = await supabase
          .from('property_images')
          .insert(insertData)
          .select();

        if (dbError) {
          console.error('❌ Database insert error:', dbError);
          throw dbError;
        }
        console.log('✅ Database insert success:', dbData);
      }

      toast({
        title: 'הצלחה',
        description: 'הקבצים הועלו בהצלחה',
      });
      loadImages();
    } catch (error) {
      console.error('❌❌❌ Error uploading files:', error);
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה בהעלאה',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: PropertyImage) => {
    try {
      // Extract file path from URL if it's from storage
      if (image.image_url.includes('supabase')) {
        const urlParts = image.image_url.split('/');
        const filePath = urlParts.slice(-2).join('/');

        // Delete from storage
        await supabase.storage
          .from('property-images')
          .remove([filePath]);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      toast({
        title: 'הצלחה',
        description: 'התמונה נמחקה בהצלחה',
      });
      loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת התמונה',
        variant: 'destructive',
      });
    }
  };

  const selectedPropertyData = properties.find(p => p.id === selectedProperty);

  return (
    <div dir="rtl" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                תמונות הנכס
              </CardTitle>
              <CardDescription>
                {selectedPropertyData?.address}
              </CardDescription>
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="בחר נכס" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isSuperAdmin && (
            <div className="mb-6">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*,video/mp4,video/quicktime,video/webm,video/x-msvideo,video/*,.mov,.MOV,.mp4,.MP4,.webm,.avi"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploading}
                className="w-full md:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'מעלה...' : 'העלה תמונות או סרטונים'}
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">טוען תמונות...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">אין תמונות או סרטונים עדיין</p>
              {isSuperAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  לחץ על "העלה תמונות או סרטונים" כדי להוסיף לנכס
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => {
                const isVideo = image.media_type === 'video';
                return (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                      {isVideo ? (
                        <>
                          <video
                            src={image.image_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            סרטון
                          </div>
                        </>
                      ) : (
                        <img
                          src={image.image_url}
                          alt={image.alt_text || 'תמונת נכס'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setViewImage(image)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(image.image_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(image)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Viewer Dialog */}
      <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewImage?.alt_text || (viewImage?.media_type === 'video' ? 'סרטון נכס' : 'תמונת נכס')}</DialogTitle>
          </DialogHeader>
          {viewImage && (
            <div className="w-full">
              {viewImage.media_type === 'video' ? (
                <video
                  src={viewImage.image_url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <img
                  src={viewImage.image_url}
                  alt={viewImage.alt_text || 'תמונת נכס'}
                  className="w-full h-auto rounded-lg"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
