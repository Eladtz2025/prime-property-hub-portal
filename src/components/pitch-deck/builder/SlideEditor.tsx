import { useState, useEffect, useRef, useCallback } from 'react';
import { PitchDeckSlide, SlideType, SLIDE_TYPE_LABELS } from '@/types/pitch-deck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Loader2, Check } from 'lucide-react';
import BackgroundImagePicker from './BackgroundImagePicker';
import { SlideEditorErrorBoundary } from './SlideEditorErrorBoundary';

// Safe array helper - ensures we always get an array
const safeArray = <T,>(value: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return fallback;
  return fallback;
};

// Safe string helper
const safeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

interface SlideEditorProps {
  slide: PitchDeckSlide;
  language: 'he' | 'en';
  propertyId?: string;
  onUpdate: (updates: Partial<PitchDeckSlide>) => void;
  onClose: () => void;
}

const SlideEditor = ({ slide, language, propertyId, onUpdate, onClose }: SlideEditorProps) => {
  const [slideData, setSlideData] = useState<Record<string, unknown>>(slide.slide_data as Record<string, unknown>);
  const [backgroundImage, setBackgroundImage] = useState(slide.background_image || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<PitchDeckSlide>>({});

  // Sync state when slide prop changes
  useEffect(() => {
    const data = slide.slide_data as Record<string, unknown>;
    console.log('[SlideEditor] Loading slide:', {
      id: slide.id,
      type: slide.slide_type,
      dataKeys: data ? Object.keys(data) : 'null',
      data: data
    });
    setSlideData(data || {});
    setBackgroundImage(slide.background_image || '');
    setHasUnsavedChanges(false);
    setShowSaved(false);
  }, [slide.id, slide.slide_type]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save before component unmounts (switching slides)
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && Object.keys(pendingUpdatesRef.current).length > 0) {
        onUpdate(pendingUpdatesRef.current);
      }
    };
  }, [hasUnsavedChanges, onUpdate]);

  const debouncedSave = useCallback((updates: Partial<PitchDeckSlide>) => {
    // Accumulate updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
    setHasUnsavedChanges(true);
    setShowSaved(false);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      onUpdate(pendingUpdatesRef.current);
      pendingUpdatesRef.current = {};
      
      // Show saved indicator after a short delay
      setTimeout(() => {
        setIsSaving(false);
        setHasUnsavedChanges(false);
        setShowSaved(true);
        
        // Hide saved indicator after 2 seconds
        if (savedIndicatorTimeoutRef.current) {
          clearTimeout(savedIndicatorTimeoutRef.current);
        }
        savedIndicatorTimeoutRef.current = setTimeout(() => {
          setShowSaved(false);
        }, 2000);
      }, 300);
    }, 500);
  }, [onUpdate]);

  const handleDataChange = (key: string, value: unknown) => {
    const newData = { ...slideData, [key]: value };
    setSlideData(newData);
    debouncedSave({ slide_data: newData });
  };

  const handleArrayItemChange = (key: string, index: number, field: string, value: string) => {
    const array = [...safeArray<Record<string, string>>(slideData[key])];
    if (index >= 0 && index < array.length) {
      array[index] = { ...(array[index] || {}), [field]: value };
      handleDataChange(key, array);
    }
  };

  const handleAddArrayItem = (key: string, template: Record<string, string>) => {
    const array = [...safeArray<Record<string, string>>(slideData[key])];
    array.push(template);
    handleDataChange(key, array);
  };

  const handleRemoveArrayItem = (key: string, index: number) => {
    const array = [...safeArray<Record<string, string>>(slideData[key])];
    if (index >= 0 && index < array.length) {
      array.splice(index, 1);
      handleDataChange(key, array);
    }
  };

  const handleStringArrayChange = (key: string, index: number, value: string) => {
    const array = [...safeArray<string>(slideData[key])];
    if (index >= 0 && index < array.length) {
      array[index] = value;
      handleDataChange(key, array);
    }
  };

  const handleAddStringArrayItem = (key: string) => {
    const array = [...safeArray<string>(slideData[key])];
    array.push('');
    handleDataChange(key, array);
  };

  const handleRemoveStringArrayItem = (key: string, index: number) => {
    const array = [...safeArray<string>(slideData[key])];
    if (index >= 0 && index < array.length) {
      array.splice(index, 1);
      handleDataChange(key, array);
    }
  };

  const handleBackgroundChange = (value: string) => {
    setBackgroundImage(value);
    debouncedSave({ background_image: value });
  };

  const renderFields = () => {
    switch (slide.slide_type) {
      case 'title':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת ראשית</Label>
              <Input
                value={(slideData.main_title as string) || ''}
                onChange={(e) => handleDataChange('main_title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label>כותרת משנית</Label>
              <Input
                value={(slideData.subtitle as string) || ''}
                onChange={(e) => handleDataChange('subtitle', e.target.value)}
                dir="auto"
              />
            </div>
          </>
        );

      case 'property':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label>כותרת למובייל (קצרה יותר)</Label>
              <Input
                value={(slideData.title_mobile as string) || ''}
                onChange={(e) => handleDataChange('title_mobile', e.target.value)}
                dir="auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>פרטי הדירה</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArrayItem('apartment_details', { icon: 'Square', text: '' })}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.apartment_details as Array<{ icon: string; text: string }> || []).map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    value={item.icon}
                    onChange={(e) => handleArrayItemChange('apartment_details', index, 'icon', e.target.value)}
                    placeholder="אייקון"
                    className="w-24"
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => handleArrayItemChange('apartment_details', index, 'text', e.target.value)}
                    placeholder="טקסט"
                    className="flex-1"
                    dir="auto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArrayItem('apartment_details', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>פרטי הבניין</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArrayItem('building_details', { icon: 'Building2', text: '' })}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.building_details as Array<{ icon: string; text: string }> || []).map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    value={item.icon}
                    onChange={(e) => handleArrayItemChange('building_details', index, 'icon', e.target.value)}
                    placeholder="אייקון"
                    className="w-24"
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => handleArrayItemChange('building_details', index, 'text', e.target.value)}
                    placeholder="טקסט"
                    className="flex-1"
                    dir="auto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArrayItem('building_details', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        );

      case 'features':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>תכונות מפתח</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('key_features')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.key_features as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('key_features', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('key_features', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>ערכים מוספים</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('value_elements')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.value_elements as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('value_elements', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('value_elements', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>ציטוט</Label>
              <Textarea
                value={(slideData.quote as string) || ''}
                onChange={(e) => handleDataChange('quote', e.target.value)}
                dir="auto"
              />
            </div>
          </>
        );

      case 'pricing':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>מחיר למ"ר</Label>
                <Input
                  value={(slideData.price_per_sqm as string) || ''}
                  onChange={(e) => handleDataChange('price_per_sqm', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>טווח מכירות</Label>
                <Input
                  value={(slideData.sales_range as string) || ''}
                  onChange={(e) => handleDataChange('sales_range', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>גודל עסקה ממוצע</Label>
                <Input
                  value={(slideData.avg_deal_size as string) || ''}
                  onChange={(e) => handleDataChange('avg_deal_size', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>מחיר מינימום (מיליון)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={(slideData.min_price as number) || ''}
                  onChange={(e) => handleDataChange('min_price', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>מחיר מקסימום (מיליון)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={(slideData.max_price as number) || ''}
                  onChange={(e) => handleDataChange('max_price', parseFloat(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>נקודות אסטרטגיות</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('strategic_points')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.strategic_points as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('strategic_points', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('strategic_points', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        );

      case 'contact':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>צ'קליסט</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('checklist')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.checklist as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('checklist', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('checklist', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>ציטוט</Label>
              <Textarea
                value={(slideData.quote as string) || ''}
                onChange={(e) => handleDataChange('quote', e.target.value)}
                dir="auto"
              />
            </div>
            
          </>
        );

      case 'neighborhood':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label>כותרת משנית</Label>
              <Input
                value={(slideData.subtitle as string) || ''}
                onChange={(e) => handleDataChange('subtitle', e.target.value)}
                dir="auto"
                placeholder="Ben Yehuda · Dizengoff · Gordon"
              />
            </div>
            <div className="space-y-2">
              <Label>מרחק מהחוף (דקות)</Label>
              <Input
                type="number"
                value={(slideData.beach_distance as number) || ''}
                onChange={(e) => handleDataChange('beach_distance', parseInt(e.target.value) || 0)}
              />
            </div>
            
            {/* Map settings */}
            <div className="pt-4 border-t space-y-3">
              <Label className="text-base font-medium">הגדרות מפה</Label>
              <div className="space-y-2">
                <Label>שם הנכס (מרכז המפה)</Label>
                <Input
                  value={(slideData.property_name as string) || ''}
                  onChange={(e) => handleDataChange('property_name', e.target.value)}
                  dir="auto"
                  placeholder="Ben Yehuda 110"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ציון דרך שמאלי</Label>
                  <Input
                    value={(slideData.left_landmark as string) || ''}
                    onChange={(e) => handleDataChange('left_landmark', e.target.value)}
                    placeholder="Gordon Beach"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מרחק שמאל</Label>
                  <Input
                    value={(slideData.left_distance as string) || ''}
                    onChange={(e) => handleDataChange('left_distance', e.target.value)}
                    placeholder="3 min"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ציון דרך ימני</Label>
                  <Input
                    value={(slideData.right_landmark as string) || ''}
                    onChange={(e) => handleDataChange('right_landmark', e.target.value)}
                    placeholder="Dizengoff"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מרחק ימין</Label>
                  <Input
                    value={(slideData.right_distance as string) || ''}
                    onChange={(e) => handleDataChange('right_distance', e.target.value)}
                    placeholder="5 min"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>דגשי מיקום</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('location_highlights')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.location_highlights as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('location_highlights', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('location_highlights', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>מתאים ל...</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('appeals_to')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.appeals_to as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('appeals_to', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('appeals_to', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        );

      case 'marketing':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label>ציטוט מיצוב</Label>
              <Textarea
                value={(slideData.positioning_quote as string) || ''}
                onChange={(e) => handleDataChange('positioning_quote', e.target.value)}
                dir="auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>אסטרטגיה ויזואלית</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('visual_strategy')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.visual_strategy as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('visual_strategy', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('visual_strategy', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>קהלי יעד</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('target_audiences')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.target_audiences as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('target_audiences', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('target_audiences', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>אסטרטגיית חשיפה</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('exposure_strategy')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.exposure_strategy as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('exposure_strategy', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('exposure_strategy', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        );

      case 'timeline':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>שלבי ציר הזמן</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArrayItem('timeline_items', { number: '1', period: '', description: '', icon: 'FileSearch' })}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף שלב
                </Button>
              </div>
              {(slideData.timeline_items as Array<{ number: number; period: string; description: string; icon: string }> || []).map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">שלב {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem('timeline_items', index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.period}
                      onChange={(e) => handleArrayItemChange('timeline_items', index, 'period', e.target.value)}
                      placeholder="תקופה (לדוג׳: שבוע 1-2)"
                      dir="auto"
                    />
                    <Input
                      value={item.icon}
                      onChange={(e) => handleArrayItemChange('timeline_items', index, 'icon', e.target.value)}
                      placeholder="אייקון"
                    />
                  </div>
                  <Input
                    value={item.description}
                    onChange={(e) => handleArrayItemChange('timeline_items', index, 'description', e.target.value)}
                    placeholder="תיאור"
                    dir="auto"
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'marketing2':
      case 'marketing_ii':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label>הצהרה פותחת</Label>
              <Textarea
                value={(slideData.opening_statement as string) || ''}
                onChange={(e) => handleDataChange('opening_statement', e.target.value)}
                dir="auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>הגישה שלנו</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArrayItem('our_approach', { icon: 'Check', text: '' })}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.our_approach as Array<{ icon: string; text: string }> || []).map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    value={item.icon}
                    onChange={(e) => handleArrayItemChange('our_approach', index, 'icon', e.target.value)}
                    placeholder="אייקון"
                    className="w-24"
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => handleArrayItemChange('our_approach', index, 'text', e.target.value)}
                    placeholder="טקסט"
                    className="flex-1"
                    dir="auto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArrayItem('our_approach', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>הצהרה תחתונה</Label>
              <Textarea
                value={(slideData.bottom_statement as string) || ''}
                onChange={(e) => handleDataChange('bottom_statement', e.target.value)}
                dir="auto"
              />
            </div>
          </>
        );

      case 'about':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label>ציטוט בוטיק</Label>
              <Textarea
                value={(slideData.boutique_quote as string) || ''}
                onChange={(e) => handleDataChange('boutique_quote', e.target.value)}
                dir="auto"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>גישה בוטיקית</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStringArrayItem('boutique_approach')}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.boutique_approach as string[] || []).map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleStringArrayChange('boutique_approach', index, e.target.value)}
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStringArrayItem('boutique_approach', index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>חברי צוות</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArrayItem('team_members', { name: '', years: '', expertise: '', icon: 'Award' })}
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף חבר צוות
                </Button>
              </div>
              {(slideData.team_members as Array<{ name: string; years: string; expertise: string; icon: string }> || []).map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">חבר צוות {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem('team_members', index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => handleArrayItemChange('team_members', index, 'name', e.target.value)}
                      placeholder="שם"
                      dir="auto"
                    />
                    <Input
                      value={item.years}
                      onChange={(e) => handleArrayItemChange('team_members', index, 'years', e.target.value)}
                      placeholder="שנות ניסיון"
                    />
                  </div>
                  <Input
                    value={item.expertise}
                    onChange={(e) => handleArrayItemChange('team_members', index, 'expertise', e.target.value)}
                    placeholder="התמחות"
                    dir="auto"
                  />
                  <Input
                    value={item.icon}
                    onChange={(e) => handleArrayItemChange('team_members', index, 'icon', e.target.value)}
                    placeholder="אייקון"
                    className="w-32"
                  />
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>ציטוט סיום</Label>
              <Textarea
                value={(slideData.closing_quote as string) || ''}
                onChange={(e) => handleDataChange('closing_quote', e.target.value)}
                dir="auto"
              />
            </div>
          </>
        );

      case 'step1_pricing':
        return (
          <>
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={(slideData.title as string) || ''}
                onChange={(e) => handleDataChange('title', e.target.value)}
                dir="auto"
              />
            </div>
            <div className="space-y-2">
              <Label>כותרת משנה</Label>
              <Input
                value={(slideData.subtitle as string) || ''}
                onChange={(e) => handleDataChange('subtitle', e.target.value)}
                dir="auto"
              />
            </div>
            
            {/* Option A */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h4 className="font-medium text-sm">אופציה א׳ (פרימיום)</h4>
              <div className="space-y-2">
                <Label>מחיר</Label>
                <Input
                  value={(slideData.option_a_price as string) || ''}
                  onChange={(e) => handleDataChange('option_a_price', e.target.value)}
                  placeholder="₪4,250,000"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Input
                  value={(slideData.option_a_description as string) || ''}
                  onChange={(e) => handleDataChange('option_a_description', e.target.value)}
                  dir="auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>חודשים (מינ׳)</Label>
                  <Input
                    type="number"
                    value={(slideData.option_a_months_min as number) || 0}
                    onChange={(e) => handleDataChange('option_a_months_min', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>חודשים (מקס׳)</Label>
                  <Input
                    type="number"
                    value={(slideData.option_a_months_max as number) || 0}
                    onChange={(e) => handleDataChange('option_a_months_max', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Option B */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h4 className="font-medium text-sm">אופציה ב׳ (תחרותי)</h4>
              <div className="space-y-2">
                <Label>מחיר</Label>
                <Input
                  value={(slideData.option_b_price as string) || ''}
                  onChange={(e) => handleDataChange('option_b_price', e.target.value)}
                  placeholder="₪3,950,000"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Input
                  value={(slideData.option_b_description as string) || ''}
                  onChange={(e) => handleDataChange('option_b_description', e.target.value)}
                  dir="auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>חודשים (מינ׳)</Label>
                  <Input
                    type="number"
                    value={(slideData.option_b_months_min as number) || 0}
                    onChange={(e) => handleDataChange('option_b_months_min', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>חודשים (מקס׳)</Label>
                  <Input
                    type="number"
                    value={(slideData.option_b_months_max as number) || 0}
                    onChange={(e) => handleDataChange('option_b_months_max', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Recently Sold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>נמכרו לאחרונה</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArrayItem('recently_sold', { address: '', price: '', builtSize: '', balconySize: '', pricePerSqm: '', link: '' })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.recently_sold as Array<{ address: string; price: string; builtSize?: string; balconySize?: string; pricePerSqm?: string; link?: string; size?: string }> || []).map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">נכס {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem('recently_sold', index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {/* Row 1: Address + Link */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.address}
                      onChange={(e) => handleArrayItemChange('recently_sold', index, 'address', e.target.value)}
                      placeholder="כתובת"
                      dir="auto"
                    />
                    <Input
                      value={item.link || ''}
                      onChange={(e) => handleArrayItemChange('recently_sold', index, 'link', e.target.value)}
                      placeholder="לינק לנכס (URL)"
                      dir="ltr"
                    />
                  </div>
                  {/* Row 2: Price + Price per sqm */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.price}
                      onChange={(e) => handleArrayItemChange('recently_sold', index, 'price', e.target.value)}
                      placeholder="מחיר (₪4.1M)"
                      dir="ltr"
                    />
                    <Input
                      value={item.pricePerSqm || ''}
                      onChange={(e) => handleArrayItemChange('recently_sold', index, 'pricePerSqm', e.target.value)}
                      placeholder="מחיר למ״ר (₪68,000)"
                      dir="ltr"
                    />
                  </div>
                  {/* Row 3: Built size + Balcony size */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.builtSize || item.size || ''}
                      onChange={(e) => handleArrayItemChange('recently_sold', index, 'builtSize', e.target.value)}
                      placeholder="גודל בנוי (מ״ר)"
                      dir="ltr"
                    />
                    <Input
                      value={item.balconySize || ''}
                      onChange={(e) => handleArrayItemChange('recently_sold', index, 'balconySize', e.target.value)}
                      placeholder="גודל מרפסות (מ״ר)"
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Currently For Sale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>כרגע למכירה</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArrayItem('currently_for_sale', { address: '', price: '', builtSize: '', balconySize: '', pricePerSqm: '', link: '' })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  הוסף
                </Button>
              </div>
              {(slideData.currently_for_sale as Array<{ address: string; price: string; builtSize?: string; balconySize?: string; pricePerSqm?: string; link?: string; size?: string }> || []).map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">נכס {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveArrayItem('currently_for_sale', index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {/* Row 1: Address + Link */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.address}
                      onChange={(e) => handleArrayItemChange('currently_for_sale', index, 'address', e.target.value)}
                      placeholder="כתובת"
                      dir="auto"
                    />
                    <Input
                      value={item.link || ''}
                      onChange={(e) => handleArrayItemChange('currently_for_sale', index, 'link', e.target.value)}
                      placeholder="לינק לנכס (URL)"
                      dir="ltr"
                    />
                  </div>
                  {/* Row 2: Price + Price per sqm */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.price}
                      onChange={(e) => handleArrayItemChange('currently_for_sale', index, 'price', e.target.value)}
                      placeholder="מחיר (₪4.1M)"
                      dir="ltr"
                    />
                    <Input
                      value={item.pricePerSqm || ''}
                      onChange={(e) => handleArrayItemChange('currently_for_sale', index, 'pricePerSqm', e.target.value)}
                      placeholder="מחיר למ״ר (₪68,000)"
                      dir="ltr"
                    />
                  </div>
                  {/* Row 3: Built size + Balcony size */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.builtSize || item.size || ''}
                      onChange={(e) => handleArrayItemChange('currently_for_sale', index, 'builtSize', e.target.value)}
                      placeholder="גודל בנוי (מ״ר)"
                      dir="ltr"
                    />
                    <Input
                      value={item.balconySize || ''}
                      onChange={(e) => handleArrayItemChange('currently_for_sale', index, 'balconySize', e.target.value)}
                      placeholder="גודל מרפסות (מ״ר)"
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      default:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              עריכה מתקדמת לסוג סלייד זה תהיה זמינה בקרוב.
            </p>
            <Textarea
              value={JSON.stringify(slideData, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setSlideData(parsed);
                  onUpdate({ slide_data: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="font-mono text-xs min-h-[200px]"
              dir="ltr"
            />
          </div>
        );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          עריכת סלייד: {SLIDE_TYPE_LABELS[slide.slide_type]?.he || slide.slide_type}
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-normal">
              <Loader2 className="h-3 w-3 animate-spin" />
              שומר...
            </span>
          )}
          {showSaved && !isSaving && !hasUnsavedChanges && (
            <span className="text-xs text-green-600 flex items-center gap-1 font-normal">
              <Check className="h-3 w-3" />
              נשמר
            </span>
          )}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Background Image */}
        <BackgroundImagePicker
          propertyId={propertyId}
          value={backgroundImage}
          onChange={handleBackgroundChange}
        />
        
        {/* Dynamic Fields */}
        {renderFields()}
      </CardContent>
    </Card>
  );
};

// Wrapped component with error boundary
const SlideEditorWithErrorBoundary = (props: SlideEditorProps) => {
  return (
    <SlideEditorErrorBoundary 
      slideType={props.slide.slide_type} 
      slideId={props.slide.id}
    >
      <SlideEditor {...props} />
    </SlideEditorErrorBoundary>
  );
};

export default SlideEditorWithErrorBoundary;
