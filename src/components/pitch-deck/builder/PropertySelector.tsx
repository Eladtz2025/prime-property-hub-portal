import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Building2, Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Agent details from assigned_user_id
  agent_name?: string;
  agent_phone?: string;
}

const PropertySelector = ({ value, onChange }: PropertySelectorProps) => {
  const [open, setOpen] = useState(false);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties-for-pitch-deck'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id, title, address, city, rooms, property_size, floor, elevator, parking, balcony, 
          owner_name, owner_phone, owner_email,
          assigned_user:profiles!properties_assigned_user_id_fkey(full_name, phone)
        `)
        .order('address', { ascending: true });
      
      if (error) throw error;
      
      // Map the nested assigned_user to flat agent fields
      return data.map((property: any) => ({
        ...property,
        agent_name: property.assigned_user?.full_name || undefined,
        agent_phone: property.assigned_user?.phone || undefined,
        assigned_user: undefined, // Remove nested object
      })) as PropertyData[];
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

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        בחירת נכס
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {isLoading ? (
              'טוען...'
            ) : selectedProperty ? (
              <span className="truncate">
                {selectedProperty.address}, {selectedProperty.city}
                {selectedProperty.rooms && ` · ${selectedProperty.rooms} חד'`}
              </span>
            ) : (
              'בחר נכס...'
            )}
            <div className="flex items-center gap-1 mr-2">
              {selectedProperty && (
                <X 
                  className="h-4 w-4 opacity-50 hover:opacity-100" 
                  onClick={handleClear}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="חיפוש נכס..." />
            <CommandList>
              <CommandEmpty>לא נמצאו נכסים</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => handleSelect('none')}
                >
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  ללא קישור לנכס
                </CommandItem>
                {properties?.map((property) => (
                  <CommandItem
                    key={property.id}
                    value={`${property.address} ${property.city} ${property.rooms || ''}`}
                    onSelect={() => handleSelect(property.id)}
                  >
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value === property.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>
                        {property.address}, {property.city}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {property.rooms && `${property.rooms} חד'`}
                        {property.property_size && ` · ${property.property_size} מ"ר`}
                        {property.floor !== undefined && ` · קומה ${property.floor}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        בחירת נכס תמלא אוטומטית את שם המצגת וכתובת ה-URL
      </p>
    </div>
  );
};

export default PropertySelector;
