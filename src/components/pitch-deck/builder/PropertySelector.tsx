import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  const [open, setOpen] = useState(false);

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

  const selectedProperty = properties?.find(p => p.id === value);

  const handleSelect = (propertyId: string) => {
    if (propertyId === 'none') {
      onChange(undefined);
    } else {
      const property = properties?.find(p => p.id === propertyId);
      onChange(propertyId, property);
    }
    setOpen(false);
  };

  const getDisplayText = () => {
    if (isLoading) return 'טוען...';
    if (!value || !selectedProperty) return 'בחר נכס (אופציונלי)';
    return `${selectedProperty.address}, ${selectedProperty.city}${selectedProperty.rooms ? ` · ${selectedProperty.rooms} חד'` : ''}`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        קישור לנכס
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="חפש לפי כתובת או עיר..." />
            <CommandList>
              <CommandEmpty>לא נמצאו נכסים</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => handleSelect('none')}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  ללא קישור לנכס
                </CommandItem>
                {properties?.map((property) => (
                  <CommandItem
                    key={property.id}
                    value={`${property.address} ${property.city} ${property.title || ''}`}
                    onSelect={() => handleSelect(property.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === property.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{property.address}, {property.city}</span>
                      {property.rooms && (
                        <span className="text-xs text-muted-foreground">
                          {property.rooms} חד' {property.property_size && `· ${property.property_size} מ"ר`}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        בחירת נכס תמלא אוטומטית את פרטי הנכס ופרטי הקשר במצגת
      </p>
    </div>
  );
};

export default PropertySelector;
