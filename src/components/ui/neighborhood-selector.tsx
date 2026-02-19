import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NEIGHBORHOODS, Neighborhood, CITIES, SOURCE_NEIGHBORHOODS } from "@/config/locations";
import { filterNeighborhoodsBySource, getSupportedSources } from "@/config/neighborhoodSupport";
import { cn } from "@/lib/utils";
import { ChevronDown, Building2, Info } from "lucide-react";

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

// Helper function to normalize neighborhood values to canonical form
// This handles cases where DB has variations like "צפון הישן" instead of "צפון_ישן"
function normalizeNeighborhoodValue(value: string, cities: string[]): string {
  if (!value) return value;
  const normalized = value.toLowerCase().trim();
  
  // Try to find the neighborhood in any of the selected cities
  for (const city of cities) {
    const normalizedCity = normalizeCityValue(city);
    const cityNeighborhoods = NEIGHBORHOODS[normalizedCity];
    if (!cityNeighborhoods) continue;
    
    for (const neighborhood of cityNeighborhoods) {
      // Check exact value match
      if (neighborhood.value.toLowerCase() === normalized) {
        return neighborhood.value;
      }
      // Check label match (e.g., "צפון ישן" -> "צפון_ישן")
      if (neighborhood.label.toLowerCase() === normalized) {
        return neighborhood.value;
      }
      // Check aliases
      for (const alias of neighborhood.aliases) {
        if (alias.toLowerCase() === normalized || 
            normalized.includes(alias.toLowerCase()) ||
            alias.toLowerCase().includes(normalized)) {
          return neighborhood.value;
        }
      }
    }
  }
  return value;
}

// Normalize an array of neighborhoods to canonical values
function normalizeNeighborhoods(neighborhoods: string[], cities: string[]): string[] {
  return neighborhoods.map(n => normalizeNeighborhoodValue(n, cities));
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
  // Normalize selected neighborhoods to canonical values
  const normalizedSelection = normalizeNeighborhoods(selectedNeighborhoods, selectedCities);
  
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

  const isNeighborhoodSelected = (neighborhoodValue: string) => {
    return normalizedSelection.includes(neighborhoodValue);
  };

  const toggleNeighborhood = (neighborhoodValue: string) => {
    if (isNeighborhoodSelected(neighborhoodValue)) {
      // Remove - filter out both the canonical value and any variations
      const newSelection = normalizedSelection.filter(n => n !== neighborhoodValue);
      onChange(newSelection);
    } else {
      // Add the canonical value
      onChange([...normalizedSelection, neighborhoodValue]);
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
                  isNeighborhoodSelected(neighborhood.value)
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
  // Normalize selected neighborhoods to canonical values
  const normalizedSelection = normalizeNeighborhoods(selectedNeighborhoods, selectedCities);
  
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

  const isNeighborhoodSelected = (neighborhoodValue: string) => {
    return normalizedSelection.includes(neighborhoodValue);
  };

  const toggleNeighborhood = (neighborhoodValue: string) => {
    if (isNeighborhoodSelected(neighborhoodValue)) {
      const newSelection = normalizedSelection.filter(n => n !== neighborhoodValue);
      onChange(newSelection);
    } else {
      onChange([...normalizedSelection, neighborhoodValue]);
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
                  checked={isNeighborhoodSelected(neighborhood.value)}
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
  /** Optional: filter neighborhoods to only those supported by this source */
  filterBySource?: string;
}

export function NeighborhoodSelectorDropdown({ 
  selectedCities, 
  selectedNeighborhoods, 
  onChange,
  className,
  filterBySource
}: NeighborhoodSelectorDropdownProps) {
  const [open, setOpen] = useState(false);
  
  // Normalize selected neighborhoods to canonical values
  const normalizedSelection = normalizeNeighborhoods(selectedNeighborhoods, selectedCities);

  // Get all neighborhoods for selected cities
  // If a source has specific neighborhoods defined, use those instead of the general list
  const availableNeighborhoods: { city: string; cityLabel: string; neighborhoods: Neighborhood[] }[] = [];
  
  for (const cityValue of selectedCities) {
    // Normalize city value to find neighborhoods
    const normalizedCity = normalizeCityValue(cityValue);
    
    // Check if this source has specific neighborhoods defined (e.g., Homeless has only 6 broad areas)
    let neighborhoods: Neighborhood[] = [];
    if (filterBySource && SOURCE_NEIGHBORHOODS[filterBySource]?.[normalizedCity]) {
      // Use source-specific neighborhoods (displayed exactly as they appear on that site)
      neighborhoods = SOURCE_NEIGHBORHOODS[filterBySource][normalizedCity];
    } else {
      // Use general neighborhoods and optionally filter by source support
      neighborhoods = NEIGHBORHOODS[normalizedCity] || [];
      if (filterBySource) {
        neighborhoods = filterNeighborhoodsBySource(neighborhoods, filterBySource);
      }
    }
    
    if (neighborhoods.length > 0) {
      const cityConfig = CITIES.find(c => c.value === normalizedCity || c.value === cityValue);
      availableNeighborhoods.push({
        city: cityValue,
        cityLabel: cityConfig?.label || cityValue,
        neighborhoods
      });
    }
  }

  const isNeighborhoodSelected = (neighborhoodValue: string) => {
    return normalizedSelection.includes(neighborhoodValue);
  };

  const toggleNeighborhood = (neighborhoodValue: string) => {
    if (isNeighborhoodSelected(neighborhoodValue)) {
      const newSelection = normalizedSelection.filter(n => n !== neighborhoodValue);
      onChange(newSelection);
    } else {
      onChange([...normalizedSelection, neighborhoodValue]);
    }
  };

  const getDisplayText = () => {
    if (selectedCities.length === 0) return "בחר עיר קודם";
    if (normalizedSelection.length === 0) return "בחר שכונות...";
    if (normalizedSelection.length === 1) {
      // Find the neighborhood label
      for (const { neighborhoods } of availableNeighborhoods) {
        const n = neighborhoods.find(n => n.value === normalizedSelection[0]);
        if (n) return n.label;
      }
      return normalizedSelection[0];
    }
    return `${normalizedSelection.length} שכונות נבחרו`;
  };

  // Get source label for display
  const getSourceLabel = (source: string): string => {
    const labels: Record<string, string> = {
      'yad2': 'יד2',
      'madlan': 'מדלן',
      'homeless': 'הומלס'
    };
    return labels[source] || source;
  };

  const isDisabled = selectedCities.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-full justify-between h-11 text-sm font-normal", className)}
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
              {neighborhoods.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  אין שכונות נתמכות ל{filterBySource ? getSourceLabel(filterBySource) : 'מקור זה'}
                </p>
              ) : (
                <div className="space-y-1">
                  {neighborhoods.map((neighborhood) => {
                    const supportedSources = getSupportedSources(neighborhood.value);
                    return (
                      <div
                        key={neighborhood.value}
                        onClick={() => toggleNeighborhood(neighborhood.value)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                          isNeighborhoodSelected(neighborhood.value)
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={isNeighborhoodSelected(neighborhood.value)}
                          onCheckedChange={() => toggleNeighborhood(neighborhood.value)}
                        />
                        <span className="text-sm flex-1">{neighborhood.label}</span>
                        {!filterBySource && supportedSources.length < 3 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex gap-0.5">
                                  {['yad2', 'madlan', 'homeless'].map(source => (
                                    <span 
                                      key={source}
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        supportedSources.includes(source) 
                                          ? "bg-primary" 
                                          : "bg-muted-foreground/30"
                                      )}
                                    />
                                  ))}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">
                                <div>נתמך ע"י: {supportedSources.map(s => getSourceLabel(s)).join(', ')}</div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
