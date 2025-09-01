import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Calendar as CalendarIcon, 
  Filter, 
  X, 
  Save,
  Home,
  DollarSign,
  Users
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from 'date-fns/locale';

export interface SearchFilters {
  searchTerm: string;
  status: string;
  priceRange: [number, number];
  ownerPropertyCount: [number, number];
  leaseExpiryStart?: Date;
  leaseExpiryEnd?: Date;
  hasOwnerPhone: boolean;
  hasTenantPhone: boolean;
  hasEmail: boolean;
  searchOperator: 'AND' | 'OR';
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  savedSearches: SavedSearch[];
  onSaveSearch: (name: string, filters: SearchFilters) => void;
  onLoadSearch: (search: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
  onClearFilters: () => void;
  propertyCount: number;
  maxPrice: number;
  maxOwnerCount: number;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
  onClearFilters,
  propertyCount,
  maxPrice,
  maxOwnerCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm ||
      filters.status !== 'all' ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < maxPrice ||
      filters.ownerPropertyCount[0] > 1 ||
      filters.ownerPropertyCount[1] < maxOwnerCount ||
      filters.leaseExpiryStart ||
      filters.leaseExpiryEnd ||
      filters.hasOwnerPhone ||
      filters.hasTenantPhone ||
      filters.hasEmail
    );
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            חיפוש וסינון מתקדם
            {hasActiveFilters() && (
              <Badge variant="secondary" className="text-xs">
                {propertyCount} תוצאות
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4" />
              {isExpanded ? 'פשט' : 'הרחב'}
            </Button>
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                <X className="h-4 w-4" />
                נקה
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="space-y-2">
          <Label htmlFor="search">חיפוש חופשי</Label>
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="חיפוש לפי כתובת, בעל נכס, שוכר..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pr-10"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Label className="text-sm">אופן חיפוש:</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={filters.searchOperator === 'OR'}
                onCheckedChange={(checked) => 
                  updateFilter('searchOperator', checked ? 'OR' : 'AND')
                }
              />
              <Label className="text-sm">
                {filters.searchOperator === 'OR' ? 'או (OR)' : 'וגם (AND)'}
              </Label>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>סטטוס נכס</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="בחר סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="occupied">תפוס</SelectItem>
              <SelectItem value="vacant">פנוי</SelectItem>
              <SelectItem value="maintenance">תחזוקה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isExpanded && (
          <>
            <Separator />
            
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                טווח שכר דירה (₪)
              </Label>
              <div className="px-4">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                  max={maxPrice}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>₪{filters.priceRange[0].toLocaleString()}</span>
                  <span>₪{filters.priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Owner Property Count */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                מספר נכסים לבעלים
              </Label>
              <div className="px-4">
                <Slider
                  value={filters.ownerPropertyCount}
                  onValueChange={(value) => updateFilter('ownerPropertyCount', value as [number, number])}
                  max={maxOwnerCount}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{filters.ownerPropertyCount[0]} נכסים</span>
                  <span>{filters.ownerPropertyCount[1]} נכסים</span>
                </div>
              </div>
            </div>

            {/* Lease Expiry Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                טווח תאריכי סיום חוזה
              </Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-right font-normal",
                        !filters.leaseExpiryStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {filters.leaseExpiryStart ? (
                        format(filters.leaseExpiryStart, "dd/MM/yyyy", { locale: he })
                      ) : (
                        <span>תאריך התחלה</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.leaseExpiryStart}
                      onSelect={(date) => updateFilter('leaseExpiryStart', date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-right font-normal",
                        !filters.leaseExpiryEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {filters.leaseExpiryEnd ? (
                        format(filters.leaseExpiryEnd, "dd/MM/yyyy", { locale: he })
                      ) : (
                        <span>תאריך סיום</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.leaseExpiryEnd}
                      onSelect={(date) => updateFilter('leaseExpiryEnd', date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Contact Information Filters */}
            <div className="space-y-3">
              <Label>מידע יצירת קשר</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.hasOwnerPhone}
                    onCheckedChange={(checked) => updateFilter('hasOwnerPhone', checked)}
                  />
                  <Label className="text-sm">יש טלפון לבעל הנכס</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.hasTenantPhone}
                    onCheckedChange={(checked) => updateFilter('hasTenantPhone', checked)}
                  />
                  <Label className="text-sm">יש טלפון לדייר</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.hasEmail}
                    onCheckedChange={(checked) => updateFilter('hasEmail', checked)}
                  />
                  <Label className="text-sm">יש כתובת אימייל</Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Saved Searches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>חיפושים שמורים</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(!showSaveDialog)}
                >
                  <Save className="h-4 w-4 ml-1" />
                  שמור חיפוש
                </Button>
              </div>

              {showSaveDialog && (
                <div className="flex gap-2">
                  <Input
                    placeholder="שם החיפוש..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
                  />
                  <Button size="sm" onClick={handleSaveSearch}>
                    שמור
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {savedSearches.map((search) => (
                  <div key={search.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadSearch(search)}
                      className="text-xs"
                    >
                      {search.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteSearch(search.id)}
                      className="p-1 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};