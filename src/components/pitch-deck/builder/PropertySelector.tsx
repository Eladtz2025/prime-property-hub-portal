import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface PropertySelectorProps {
  value?: string;
  onChange: (propertyId: string | undefined, property?: PropertyData) => void;
}

export interface PropertyData {
  id: string;
  title?: string;
  address: string;
  city: string;
  rooms?: number;
  property_size?: number;
  floor?: number;
  elevator?: boolean;
  parking?: boolean;
  balcony?: boolean;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
}

const PropertySelector = ({ value, onChange }: PropertySelectorProps) => {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties-for-pitch-deck'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, city, rooms, property_size, floor, elevator, parking, balcony, owner_name, owner_phone, owner_email')
        .order('address', { ascending: true });
      
      if (error) throw error;
      return data as PropertyData[];
    },
  });

  const handleChange = (propertyId: string) => {
    if (propertyId === 'none') {
      onChange(undefined);
    } else {
      const property = properties?.find(p => p.id === propertyId);
      onChange(propertyId, property);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        קישור לנכס
      </label>
      <Select value={value || 'none'} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? 'טוען...' : 'בחר נכס (אופציונלי)'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">ללא קישור לנכס</SelectItem>
          {properties?.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.address}, {property.city}
              {property.rooms && ` · ${property.rooms} חד'`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        בחירת נכס תמלא אוטומטית את פרטי הנכס במצגת
      </p>
    </div>
  );
};

export default PropertySelector;
