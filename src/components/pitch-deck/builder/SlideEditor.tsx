import { useState } from 'react';
import { PitchDeckSlide, SlideType, SLIDE_TYPE_LABELS } from '@/types/pitch-deck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2 } from 'lucide-react';
import BackgroundImagePicker from './BackgroundImagePicker';

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

  const handleDataChange = (key: string, value: unknown) => {
    const newData = { ...slideData, [key]: value };
    setSlideData(newData);
    onUpdate({ slide_data: newData });
  };

  const handleArrayItemChange = (key: string, index: number, field: string, value: string) => {
    const array = [...(slideData[key] as Array<Record<string, string>> || [])];
    array[index] = { ...array[index], [field]: value };
    handleDataChange(key, array);
  };

  const handleAddArrayItem = (key: string, template: Record<string, string>) => {
    const array = [...(slideData[key] as Array<Record<string, string>> || [])];
    array.push(template);
    handleDataChange(key, array);
  };

  const handleRemoveArrayItem = (key: string, index: number) => {
    const array = [...(slideData[key] as Array<Record<string, string>> || [])];
    array.splice(index, 1);
    handleDataChange(key, array);
  };

  const handleStringArrayChange = (key: string, index: number, value: string) => {
    const array = [...(slideData[key] as string[] || [])];
    array[index] = value;
    handleDataChange(key, array);
  };

  const handleAddStringArrayItem = (key: string) => {
    const array = [...(slideData[key] as string[] || [])];
    array.push('');
    handleDataChange(key, array);
  };

  const handleRemoveStringArrayItem = (key: string, index: number) => {
    const array = [...(slideData[key] as string[] || [])];
    array.splice(index, 1);
    handleDataChange(key, array);
  };

  const handleBackgroundChange = (value: string) => {
    setBackgroundImage(value);
    onUpdate({ background_image: value });
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
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>תווית שלב 1</Label>
                <Input
                  value={(slideData.step1_label as string) || ''}
                  onChange={(e) => handleDataChange('step1_label', e.target.value)}
                  dir="auto"
                />
              </div>
              <div className="space-y-2">
                <Label>לינק שלב 1</Label>
                <Input
                  value={(slideData.step1_link as string) || ''}
                  onChange={(e) => handleDataChange('step1_link', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>תווית שלב 2</Label>
                <Input
                  value={(slideData.step2_label as string) || ''}
                  onChange={(e) => handleDataChange('step2_label', e.target.value)}
                  dir="auto"
                />
              </div>
              <div className="space-y-2">
                <Label>לינק שלב 2</Label>
                <Input
                  value={(slideData.step2_link as string) || ''}
                  onChange={(e) => handleDataChange('step2_link', e.target.value)}
                />
              </div>
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
        <CardTitle className="text-base">
          עריכת סלייד: {SLIDE_TYPE_LABELS[slide.slide_type]?.he || slide.slide_type}
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

export default SlideEditor;
