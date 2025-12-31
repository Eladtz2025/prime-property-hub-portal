import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Building2, Loader2, Check, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Property {
  id: string;
  address: string;
  city: string;
  title?: string;
  property_images?: { image_url: string }[];
}

interface SaveToPropertyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const SaveToPropertyDialog: React.FC<SaveToPropertyDialogProps> = ({
  isOpen,
  onClose,
  imageUrl
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [imageName, setImageName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = properties.filter(p => 
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  }, [searchTerm, properties]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, title, property_images(image_url)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error('שגיאה בטעינת הנכסים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProperty || !imageUrl) {
      toast.error('יש לבחור נכס');
      return;
    }

    setIsSaving(true);
    try {
      // Convert data URL to blob if needed
      let fileBlob: Blob;
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        fileBlob = await response.blob();
      } else {
        const response = await fetch(imageUrl);
        fileBlob = await response.blob();
      }

      // Generate unique filename
      const fileName = `${selectedProperty.id}/${Date.now()}-${imageName || 'studio-image'}.png`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, fileBlob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      // Add to property_images table
      const { error: insertError } = await supabase
        .from('property_images')
        .insert({
          property_id: selectedProperty.id,
          image_url: urlData.publicUrl,
          alt_text: imageName || 'תמונת סטודיו',
          is_main: false,
          show_on_website: true
        });

      if (insertError) throw insertError;

      toast.success('התמונה נשמרה בהצלחה לנכס');
      onClose();
      setSelectedProperty(null);
      setImageName('');
    } catch (error: any) {
      console.error('Error saving image:', error);
      toast.error(error.message || 'שגיאה בשמירת התמונה');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-primary" />
            שמור לגלריית נכס
          </DialogTitle>
          <DialogDescription>
            בחר נכס לשמירת התמונה
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          <div className="rounded-lg overflow-hidden bg-muted">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-32 object-cover"
            />
          </div>

          {/* Image Name */}
          <div className="space-y-2">
            <Label>שם התמונה (אופציונלי)</Label>
            <Input
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="תמונת סלון..."
            />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש נכס לפי כתובת או עיר..."
              className="pr-10"
            />
          </div>

          {/* Properties List */}
          <ScrollArea className="h-[200px] border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Building2 className="h-8 w-8 mb-2" />
                <p>לא נמצאו נכסים</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors min-h-[44px] ${
                      selectedProperty?.id === property.id 
                        ? 'bg-primary/10 border border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedProperty(property)}
                  >
                    {/* Property Thumbnail */}
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                      {property.property_images?.[0]?.image_url ? (
                        <img 
                          src={property.property_images[0].image_url} 
                          alt={property.address}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {property.title || property.address}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {property.address}, {property.city}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    {selectedProperty?.id === property.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!selectedProperty || isSaving}
            className="w-full min-h-[44px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                שומר...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 ml-2" />
                שמור לנכס
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
