import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Image as ImageIcon, Trash2, Download, Eye } from 'lucide-react';
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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedProperty}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        // Save to property_images table
        const { error: dbError } = await supabase
          .from('property_images')
          .insert({
            property_id: selectedProperty,
            image_url: publicUrl,
            alt_text: file.name,
            is_main: false,
            order_index: images.length + 1,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: 'הצלחה',
        description: 'התמונות הועלו בהצלחה',
      });
      loadImages();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהעלאת התמונות',
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
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploading}
                className="w-full md:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'מעלה...' : 'העלה תמונות'}
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
              <p className="text-muted-foreground">אין תמונות עדיין</p>
              {isSuperAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  לחץ על "העלה תמונות" כדי להוסיף תמונות לנכס
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || 'תמונת נכס'}
                      className="w-full h-full object-cover"
                    />
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewImage?.alt_text || 'תמונת נכס'}</DialogTitle>
          </DialogHeader>
          {viewImage && (
            <div className="w-full">
              <img
                src={viewImage.image_url}
                alt={viewImage.alt_text || 'תמונת נכס'}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
