import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CITIES, City } from "@/config/locations";
import { cn } from "@/lib/utils";

interface CitySelectorProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  className?: string;
}

export function CitySelector({ selectedCities, onChange, className }: CitySelectorProps) {
  const toggleCity = (cityValue: string) => {
    if (selectedCities.includes(cityValue)) {
      onChange(selectedCities.filter(c => c !== cityValue));
    } else {
      onChange([...selectedCities, cityValue]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {CITIES.map((city) => (
        <button
          key={city.value}
          type="button"
          onClick={() => toggleCity(city.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm transition-colors border",
            selectedCities.includes(city.value)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-border"
          )}
        >
          {city.label}
        </button>
      ))}
    </div>
  );
}

// Compact version with checkboxes for forms
interface CitySelectorCompactProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  className?: string;
}

export function CitySelectorCompact({ selectedCities, onChange, className }: CitySelectorCompactProps) {
  const toggleCity = (cityValue: string) => {
    if (selectedCities.includes(cityValue)) {
      onChange(selectedCities.filter(c => c !== cityValue));
    } else {
      onChange([...selectedCities, cityValue]);
    }
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {CITIES.map((city) => (
        <div key={city.value} className="flex items-center gap-2">
          <Checkbox
            id={`city-${city.value}`}
            checked={selectedCities.includes(city.value)}
            onCheckedChange={() => toggleCity(city.value)}
          />
          <Label 
            htmlFor={`city-${city.value}`} 
            className="text-sm cursor-pointer"
          >
            {city.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
