import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NEIGHBORHOODS, Neighborhood, CITIES } from "@/config/locations";
import { cn } from "@/lib/utils";

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
    const neighborhoods = NEIGHBORHOODS[cityValue];
    if (neighborhoods) {
      const cityConfig = CITIES.find(c => c.value === cityValue);
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
    const neighborhoods = NEIGHBORHOODS[cityValue];
    if (neighborhoods) {
      const cityConfig = CITIES.find(c => c.value === cityValue);
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
