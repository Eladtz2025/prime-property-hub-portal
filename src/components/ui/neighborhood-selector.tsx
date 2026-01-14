import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NEIGHBORHOODS, Neighborhood, CITIES } from "@/config/locations";
import { cn } from "@/lib/utils";
import { ChevronDown, Building2 } from "lucide-react";

// Helper function to normalize city names to canonical form for NEIGHBORHOODS lookup
function normalizeCityValue(city: string): string {
  if (!city) return city;
  const normalized = city.toLowerCase().trim().replace(/[-\s]/g, '');
  
  // Handle Tel Aviv variations
  if (normalized.includes('תלאביב') || 
      (normalized.includes('תל') && normalized.includes('אביב')) ||
      normalized === 'תא' ||
      normalized.includes('telaviv') ||
      (normalized.includes('tel') && normalized.includes('aviv'))) {
    return 'תל אביב יפו';
  }
  
  // Handle Ramat Gan variations
  if (normalized.includes('רמתגן') || 
      (normalized.includes('רמת') && normalized.includes('גן'))) {
    return 'רמת גן';
  }
  
  // Handle Givatayim variations
  if (normalized.includes('גבעתיים') || normalized.includes('גבעתים')) {
    return 'גבעתיים';
  }
  
  return city;
}

interface NeighborhoodSelectorProps {
  selectedCities: string[];
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  className?: string;
}

export function NeighborhoodSelector({ 
  selectedCities, 
  selectedNeighborhoods, 
  onChange,
  className 
}: NeighborhoodSelectorProps) {
  // Get all neighborhoods for selected cities
  const availableNeighborhoods: { city: string; cityLabel: string; neighborhoods: Neighborhood[] }[] = [];
  
  for (const cityValue of selectedCities) {
    // Normalize city value to find neighborhoods
    const normalizedCity = normalizeCityValue(cityValue);
    const neighborhoods = NEIGHBORHOODS[normalizedCity];
    if (neighborhoods) {
      const cityConfig = CITIES.find(c => c.value === normalizedCity || c.value === cityValue);
      availableNeighborhoods.push({
        city: cityValue,
        cityLabel: cityConfig?.label || cityValue,
        neighborhoods
      });
    }
  }

  const toggleNeighborhood = (neighborhoodValue: string) => {
    if (selectedNeighborhoods.includes(neighborhoodValue)) {
      onChange(selectedNeighborhoods.filter(n => n !== neighborhoodValue));
    } else {
      onChange([...selectedNeighborhoods, neighborhoodValue]);
    }
  };

  if (availableNeighborhoods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        בחרו עיר כדי לראות שכונות
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {availableNeighborhoods.map(({ city, cityLabel, neighborhoods }) => (
        <div key={city}>
          {availableNeighborhoods.length > 1 && (
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {cityLabel}:
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {neighborhoods.map((neighborhood) => (
              <button
                key={neighborhood.value}
                type="button"
                onClick={() => toggleNeighborhood(neighborhood.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors border",
                  selectedNeighborhoods.includes(neighborhood.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                {neighborhood.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact version with checkboxes
interface NeighborhoodSelectorCompactProps {
  selectedCities: string[];
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  className?: string;
}

export function NeighborhoodSelectorCompact({ 
  selectedCities, 
  selectedNeighborhoods, 
  onChange,
  className 
}: NeighborhoodSelectorCompactProps) {
  // Get all neighborhoods for selected cities
  const availableNeighborhoods: { city: string; cityLabel: string; neighborhoods: Neighborhood[] }[] = [];
  
  for (const cityValue of selectedCities) {
    // Normalize city value to find neighborhoods
    const normalizedCity = normalizeCityValue(cityValue);
    const neighborhoods = NEIGHBORHOODS[normalizedCity];
    if (neighborhoods) {
      const cityConfig = CITIES.find(c => c.value === normalizedCity || c.value === cityValue);
      availableNeighborhoods.push({
        city: cityValue,
        cityLabel: cityConfig?.label || cityValue,
        neighborhoods
      });
    }
  }

  const toggleNeighborhood = (neighborhoodValue: string) => {
    if (selectedNeighborhoods.includes(neighborhoodValue)) {
      onChange(selectedNeighborhoods.filter(n => n !== neighborhoodValue));
    } else {
      onChange([...selectedNeighborhoods, neighborhoodValue]);
    }
  };

  if (availableNeighborhoods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        בחרו עיר כדי לראות שכונות
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {availableNeighborhoods.map(({ city, cityLabel, neighborhoods }) => (
        <div key={city}>
          {availableNeighborhoods.length > 1 && (
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {cityLabel}:
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {neighborhoods.map((neighborhood) => (
              <div key={neighborhood.value} className="flex items-center gap-2">
                <Checkbox
                  id={`neighborhood-${neighborhood.value}`}
                  checked={selectedNeighborhoods.includes(neighborhood.value)}
                  onCheckedChange={() => toggleNeighborhood(neighborhood.value)}
                />
                <Label 
                  htmlFor={`neighborhood-${neighborhood.value}`} 
                  className="text-sm cursor-pointer"
                >
                  {neighborhood.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Dropdown version for inline editing
interface NeighborhoodSelectorDropdownProps {
  selectedCities: string[];
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  className?: string;
}

export function NeighborhoodSelectorDropdown({ 
  selectedCities, 
  selectedNeighborhoods, 
  onChange,
  className 
}: NeighborhoodSelectorDropdownProps) {
  const [open, setOpen] = useState(false);

  // Get all neighborhoods for selected cities
  const availableNeighborhoods: { city: string; cityLabel: string; neighborhoods: Neighborhood[] }[] = [];
  
  for (const cityValue of selectedCities) {
    // Normalize city value to find neighborhoods
    const normalizedCity = normalizeCityValue(cityValue);
    const neighborhoods = NEIGHBORHOODS[normalizedCity];
    if (neighborhoods) {
      const cityConfig = CITIES.find(c => c.value === normalizedCity || c.value === cityValue);
      availableNeighborhoods.push({
        city: cityValue,
        cityLabel: cityConfig?.label || cityValue,
        neighborhoods
      });
    }
  }

  const toggleNeighborhood = (neighborhoodValue: string) => {
    if (selectedNeighborhoods.includes(neighborhoodValue)) {
      onChange(selectedNeighborhoods.filter(n => n !== neighborhoodValue));
    } else {
      onChange([...selectedNeighborhoods, neighborhoodValue]);
    }
  };

  const getDisplayText = () => {
    if (selectedCities.length === 0) return "בחר עיר קודם";
    if (selectedNeighborhoods.length === 0) return "בחר שכונות...";
    if (selectedNeighborhoods.length === 1) {
      // Find the neighborhood label
      for (const { neighborhoods } of availableNeighborhoods) {
        const n = neighborhoods.find(n => n.value === selectedNeighborhoods[0]);
        if (n) return n.label;
      }
      return selectedNeighborhoods[0];
    }
    return `${selectedNeighborhoods.length} שכונות נבחרו`;
  };

  const isDisabled = selectedCities.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-full justify-between h-8 text-sm font-normal", className)}
          disabled={isDisabled}
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {getDisplayText()}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2 max-h-72 overflow-y-auto" align="start">
        <div className="space-y-3">
          {availableNeighborhoods.map(({ city, cityLabel, neighborhoods }) => (
            <div key={city}>
              {availableNeighborhoods.length > 1 && (
                <p className="text-xs font-medium text-muted-foreground mb-1 px-2">
                  {cityLabel}:
                </p>
              )}
              <div className="space-y-1">
                {neighborhoods.map((neighborhood) => (
                  <div
                    key={neighborhood.value}
                    onClick={() => toggleNeighborhood(neighborhood.value)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                      selectedNeighborhoods.includes(neighborhood.value)
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={selectedNeighborhoods.includes(neighborhood.value)}
                      onCheckedChange={() => toggleNeighborhood(neighborhood.value)}
                    />
                    <span className="text-sm">{neighborhood.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
