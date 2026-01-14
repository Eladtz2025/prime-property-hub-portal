import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CITIES, City } from "@/config/locations";
import { cn } from "@/lib/utils";
import { ChevronDown, MapPin } from "lucide-react";

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

// Dropdown version for inline editing
interface CitySelectorDropdownProps {
  selectedCities: string[];
  onChange: (cities: string[]) => void;
  className?: string;
}

export function CitySelectorDropdown({ selectedCities, onChange, className }: CitySelectorDropdownProps) {
  const [open, setOpen] = useState(false);

  const toggleCity = (cityValue: string) => {
    if (selectedCities.includes(cityValue)) {
      onChange(selectedCities.filter(c => c !== cityValue));
    } else {
      onChange([...selectedCities, cityValue]);
    }
  };

  const getDisplayText = () => {
    if (selectedCities.length === 0) return "בחר ערים...";
    if (selectedCities.length === 1) {
      const city = CITIES.find(c => c.value === selectedCities[0]);
      return city?.label || selectedCities[0];
    }
    return `${selectedCities.length} ערים נבחרו`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-full justify-between h-8 text-sm font-normal", className)}
        >
          <span className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {getDisplayText()}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 max-h-60 overflow-y-auto" align="start">
        <div className="space-y-1">
          {CITIES.map((city) => (
            <div
              key={city.value}
              onClick={() => toggleCity(city.value)}
              className={cn(
                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                selectedCities.includes(city.value)
                  ? "bg-primary/10"
                  : "hover:bg-muted"
              )}
            >
              <Checkbox
                checked={selectedCities.includes(city.value)}
                onCheckedChange={() => toggleCity(city.value)}
              />
              <span className="text-sm">{city.label}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
