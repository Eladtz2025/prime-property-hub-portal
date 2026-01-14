import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Car, Building2, ChevronDown, Home, Trees, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyRequirements {
  parking_required?: boolean | null;
  parking_flexible?: boolean | null;
  balcony_required?: boolean | null;
  balcony_flexible?: boolean | null;
  elevator_required?: boolean | null;
  elevator_flexible?: boolean | null;
  yard_required?: boolean | null;
  yard_flexible?: boolean | null;
  roof_required?: boolean | null;
  roof_flexible?: boolean | null;
  outdoor_space_any?: boolean | null;
}

interface PropertyRequirementsDropdownProps {
  values: PropertyRequirements;
  onChange: (values: PropertyRequirements) => void;
  className?: string;
  compact?: boolean; // For mobile/small views
}

// Regular features (non-outdoor)
const REGULAR_FEATURES = [
  { key: 'parking', label: 'חניה', icon: Car, requiredKey: 'parking_required', flexibleKey: 'parking_flexible' },
  { key: 'elevator', label: 'מעלית', icon: Building2, requiredKey: 'elevator_required', flexibleKey: 'elevator_flexible' },
] as const;

// Outdoor space features
const OUTDOOR_FEATURES = [
  { key: 'balcony', label: 'מרפסת', icon: Sun, requiredKey: 'balcony_required', flexibleKey: 'balcony_flexible' },
  { key: 'yard', label: 'חצר', icon: Trees, requiredKey: 'yard_required', flexibleKey: 'yard_flexible' },
  { key: 'roof', label: 'גג', icon: Home, requiredKey: 'roof_required', flexibleKey: 'roof_flexible' },
] as const;

type FeatureKey = 'parking_required' | 'balcony_required' | 'elevator_required' | 'yard_required' | 'roof_required';
type FlexibleKey = 'parking_flexible' | 'balcony_flexible' | 'elevator_flexible' | 'yard_flexible' | 'roof_flexible';

export const PropertyRequirementsDropdown = ({
  values,
  onChange,
  className,
  compact = false,
}: PropertyRequirementsDropdownProps) => {
  const [open, setOpen] = useState(false);

  // Get selected regular features for display
  const selectedRegularFeatures = REGULAR_FEATURES.filter(f => values[f.requiredKey as FeatureKey]);
  const selectedOutdoorFeatures = OUTDOOR_FEATURES.filter(f => values[f.requiredKey as FeatureKey]);
  const isOutdoorAnyMode = !!values.outdoor_space_any;
  
  // Build display text
  const displayParts: string[] = [];
  selectedRegularFeatures.forEach(f => displayParts.push(f.label));
  if (selectedOutdoorFeatures.length > 0) {
    if (isOutdoorAnyMode) {
      displayParts.push(`שטח חיצוני (${selectedOutdoorFeatures.map(f => f.label).join('/')})`);
    } else {
      selectedOutdoorFeatures.forEach(f => displayParts.push(f.label));
    }
  }
  const displayText = displayParts.length > 0 ? displayParts.join(', ') : 'לא נבחרו דרישות';

  const handleFeatureToggle = (requiredKey: FeatureKey, flexibleKey: FlexibleKey, checked: boolean) => {
    const newValues: PropertyRequirements = {
      ...values,
      [requiredKey]: checked,
      // When enabling, default flexible to true
      [flexibleKey]: checked ? true : null,
    };
    onChange(newValues);
  };

  const handleFlexibleToggle = (flexibleKey: FlexibleKey, checked: boolean) => {
    onChange({
      ...values,
      [flexibleKey]: checked,
    });
  };

  const handleOutdoorAnyToggle = (checked: boolean) => {
    onChange({
      ...values,
      outdoor_space_any: checked,
    });
  };

  const hasAnyOutdoorSelected = selectedOutdoorFeatures.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between text-right font-normal",
            compact ? "h-8 text-xs" : "h-9",
            displayParts.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate flex items-center gap-1.5">
            <Home className={cn("shrink-0", compact ? "h-3 w-3" : "h-4 w-4")} />
            <span className="truncate">{displayText}</span>
          </span>
          <ChevronDown className={cn("shrink-0 opacity-50", compact ? "h-3 w-3" : "h-4 w-4")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-3 bg-popover border shadow-lg z-50" 
        align="start"
        sideOffset={4}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">דרישות מהנכס:</p>
          
          {/* Regular Features */}
          {REGULAR_FEATURES.map((feature) => {
            const isRequired = !!values[feature.requiredKey as FeatureKey];
            const isFlexible = values[feature.flexibleKey as FlexibleKey] !== false;
            const Icon = feature.icon;
            
            return (
              <div 
                key={feature.key} 
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                  isRequired ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                )}
              >
                <Checkbox
                  id={`req-${feature.key}`}
                  checked={isRequired}
                  onCheckedChange={(checked) => handleFeatureToggle(feature.requiredKey as FeatureKey, feature.flexibleKey as FlexibleKey, !!checked)}
                />
                <Label 
                  htmlFor={`req-${feature.key}`} 
                  className="flex items-center gap-1.5 cursor-pointer flex-1 text-sm"
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  {feature.label}
                </Label>
                
                {isRequired && (
                  <div className="flex items-center gap-1.5 border-r pr-2">
                    <Checkbox
                      id={`flex-${feature.key}`}
                      checked={isFlexible}
                      onCheckedChange={(checked) => handleFlexibleToggle(feature.flexibleKey as FlexibleKey, !!checked)}
                    />
                    <Label 
                      htmlFor={`flex-${feature.key}`} 
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      גמיש
                    </Label>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Outdoor Space Section */}
          <div className="pt-2 mt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">שטח חיצוני:</p>
              {hasAnyOutdoorSelected && (
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="outdoor-any"
                    checked={isOutdoorAnyMode}
                    onCheckedChange={(checked) => handleOutdoorAnyToggle(!!checked)}
                  />
                  <Label 
                    htmlFor="outdoor-any" 
                    className="text-xs text-primary cursor-pointer font-medium"
                  >
                    אחד מהם מספיק
                  </Label>
                </div>
              )}
            </div>
            
            {OUTDOOR_FEATURES.map((feature) => {
              const isRequired = !!values[feature.requiredKey as FeatureKey];
              const isFlexible = values[feature.flexibleKey as FlexibleKey] !== false;
              const Icon = feature.icon;
              
              return (
                <div 
                  key={feature.key} 
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-colors mb-1",
                    isRequired ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                  )}
                >
                  <Checkbox
                    id={`req-${feature.key}`}
                    checked={isRequired}
                    onCheckedChange={(checked) => handleFeatureToggle(feature.requiredKey as FeatureKey, feature.flexibleKey as FlexibleKey, !!checked)}
                  />
                  <Label 
                    htmlFor={`req-${feature.key}`} 
                    className="flex items-center gap-1.5 cursor-pointer flex-1 text-sm"
                  >
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    {feature.label}
                  </Label>
                  
                  {isRequired && !isOutdoorAnyMode && (
                    <div className="flex items-center gap-1.5 border-r pr-2">
                      <Checkbox
                        id={`flex-${feature.key}`}
                        checked={isFlexible}
                        onCheckedChange={(checked) => handleFlexibleToggle(feature.flexibleKey as FlexibleKey, !!checked)}
                      />
                      <Label 
                        htmlFor={`flex-${feature.key}`} 
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        גמיש
                      </Label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
            {isOutdoorAnyMode 
              ? 'מצב OR: יותאמו נכסים עם לפחות אחד מהשטחים החיצוניים שנבחרו'
              : 'סמן "גמיש" אם הדרישה רצויה אך לא הכרחית'
            }
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
