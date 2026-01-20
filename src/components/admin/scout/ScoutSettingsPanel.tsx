import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useScoutSettings, useUpdateScoutSetting, defaultSettings } from "@/hooks/useScoutSettings";
import { Loader2, Settings, Search, Copy, Calculator, Calendar } from "lucide-react";

export function ScoutSettingsPanel() {
  const { data: settings, isLoading } = useScoutSettings();
  const updateSetting = useUpdateScoutSetting();

  const handleNumberChange = (category: string, key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateSetting.mutate({ category, setting_key: key, setting_value: numValue });
    }
  };

  const handleBooleanChange = (category: string, key: string, value: boolean) => {
    updateSetting.mutate({ category, setting_key: key, setting_value: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const s = settings || defaultSettings;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Scraping Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            הגדרות סריקה
          </CardTitle>
          <CardDescription>
            הגדרות עבור סריקת אתרי נדל"ן
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>דפים לסריקה ב-Yad2</Label>
              <Input
                type="number"
                min={1}
                max={20}
                defaultValue={s.scraping.yad2_pages}
                onBlur={(e) => handleNumberChange('scraping', 'yad2_pages', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>דפים לסריקה ב-Madlan</Label>
              <Input
                type="number"
                min={1}
                max={10}
                defaultValue={s.scraping.madlan_pages}
                onBlur={(e) => handleNumberChange('scraping', 'madlan_pages', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>דפים לסריקה ב-Homeless (0=מושבת)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                defaultValue={s.scraping.homeless_pages}
                onBlur={(e) => handleNumberChange('scraping', 'homeless_pages', e.target.value)}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>השהייה בין בקשות (ms)</Label>
              <Input
                type="number"
                min={500}
                max={10000}
                defaultValue={s.scraping.delay_between_requests_ms}
                onBlur={(e) => handleNumberChange('scraping', 'delay_between_requests_ms', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>השהייה למאדלן (ms)</Label>
              <Input
                type="number"
                min={1000}
                max={15000}
                defaultValue={s.scraping.madlan_delay_ms}
                onBlur={(e) => handleNumberChange('scraping', 'madlan_delay_ms', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Timeout לסריקות תקועות (דקות)</Label>
              <Input
                type="number"
                min={10}
                max={120}
                defaultValue={s.scraping.stuck_timeout_minutes}
                onBlur={(e) => handleNumberChange('scraping', 'stuck_timeout_minutes', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>מקסימום נכסים לקונפיגורציה</Label>
              <Input
                type="number"
                min={50}
                max={1000}
                defaultValue={s.scraping.max_properties_per_config}
                onBlur={(e) => handleNumberChange('scraping', 'max_properties_per_config', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Detection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            הגדרות זיהוי כפילויות
          </CardTitle>
          <CardDescription>
            נכסים נחשבים כפולים אם יש להם: כתובת עם מספר + חדרים + עיר + קומה + מחיר (עד סף ההפרש)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>סף הפרש מחיר (%)</Label>
            <Input
              type="number"
              min={5}
              max={50}
              defaultValue={s.duplicates.price_diff_threshold * 100}
              onBlur={(e) => handleNumberChange('duplicates', 'price_diff_threshold', String(parseFloat(e.target.value) / 100))}
            />
            <p className="text-xs text-muted-foreground">
              נכסים עם מחיר זהה או הפרש עד הסף יחשבו ככפילויות (ברירת מחדל: 20%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Matching Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            הגדרות התאמה
          </CardTitle>
          <CardDescription>
            לוגיקת התאמה בינארית: עיר + שכונה (חובה) → מחיר עם זליגה דינמית → חדרים → תוספות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dynamic Price Flexibility Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h5 className="font-medium text-sm">זליגת מחיר דינמית (להשכרה)</h5>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-background rounded p-2 text-center">
                <div className="font-medium text-primary">15%</div>
                <div className="text-xs text-muted-foreground">עד ₪7,000</div>
              </div>
              <div className="bg-background rounded p-2 text-center">
                <div className="font-medium text-primary">10%</div>
                <div className="text-xs text-muted-foreground">₪7,001 - ₪15,000</div>
              </div>
              <div className="bg-background rounded p-2 text-center">
                <div className="font-medium text-primary">8%</div>
                <div className="text-xs text-muted-foreground">מעל ₪15,000</div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>מקסימום התאמות לנכס</Label>
            <Input
              type="number"
              min={5}
              max={50}
              defaultValue={s.matching.max_matches_per_property}
              onBlur={(e) => handleNumberChange('matching', 'max_matches_per_property', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              מספר הלקוחות המקסימלי שניתן להתאים לנכס אחד (ברירת מחדל: 20)
            </p>
          </div>
          
          <Separator />
          
          {/* Entry Date Matching Settings */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h5 className="font-medium text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              הגדרות תאריכי כניסה (שכירות)
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>טווח לתאריך ספציפי (±ימים)</Label>
                <Input
                  type="number"
                  min={5}
                  max={30}
                  defaultValue={s.matching.entry_date_range_strict}
                  onBlur={(e) => handleNumberChange('matching', 'entry_date_range_strict', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  ברירת מחדל: 10 ימים
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>טווח לתאריך גמיש (±ימים)</Label>
                <Input
                  type="number"
                  min={7}
                  max={45}
                  defaultValue={s.matching.entry_date_range_flexible}
                  onBlur={(e) => handleNumberChange('matching', 'entry_date_range_flexible', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  ברירת מחדל: 14 ימים
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>מקסימום ימים ל"מיידי"</Label>
                <Input
                  type="number"
                  min={14}
                  max={60}
                  defaultValue={s.matching.immediate_max_days}
                  onBlur={(e) => handleNumberChange('matching', 'immediate_max_days', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  ברירת מחדל: 30 ימים
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>שליחה אוטומטית לוואטסאפ</Label>
              <p className="text-xs text-muted-foreground">
                שליחת הודעות אוטומטית ללקוחות כשנמצאת התאמה
              </p>
            </div>
            <Switch
              checked={s.matching.auto_send_whatsapp}
              onCheckedChange={(v) => handleBooleanChange('matching', 'auto_send_whatsapp', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
