import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useScoutSettings, useUpdateScoutSetting, defaultSettings } from "@/hooks/useScoutSettings";
import { Loader2, Settings, Search, Copy, Calculator } from "lucide-react";

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
            פרמטרים לזיהוי נכסים כפולים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                נכסים עם הפרש מחיר גבוה יותר לא יחשבו כפילויות
              </p>
            </div>
            <div className="space-y-2">
              <Label>סף הפרש גודל (%)</Label>
              <Input
                type="number"
                min={5}
                max={30}
                defaultValue={s.duplicates.size_diff_threshold * 100}
                onBlur={(e) => handleNumberChange('duplicates', 'size_diff_threshold', String(parseFloat(e.target.value) / 100))}
              />
              <p className="text-xs text-muted-foreground">
                נכסים עם הפרש גודל גבוה יותר לא יחשבו כפילויות
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>דרוש קומה זהה</Label>
              <p className="text-xs text-muted-foreground">
                האם לדרוש קומה זהה לזיהוי כפילות
              </p>
            </div>
            <Switch
              checked={s.duplicates.require_same_floor}
              onCheckedChange={(v) => handleBooleanChange('duplicates', 'require_same_floor', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>יצירת התראות אוטומטית</Label>
              <p className="text-xs text-muted-foreground">
                יצירת התראה כאשר מזוהות כפילויות עם הפרש מחיר
              </p>
            </div>
            <Switch
              checked={s.duplicates.auto_create_alerts}
              onCheckedChange={(v) => handleBooleanChange('duplicates', 'auto_create_alerts', v)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>הפרש מחיר מינימלי להתראה (%)</Label>
            <Input
              type="number"
              min={0}
              max={50}
              defaultValue={s.duplicates.min_price_diff_for_alert}
              onBlur={(e) => handleNumberChange('duplicates', 'min_price_diff_for_alert', e.target.value)}
            />
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
            פרמטרים להתאמת נכסים ללקוחות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ציון מינימלי להתאמה</Label>
              <Input
                type="number"
                min={30}
                max={90}
                defaultValue={s.matching.min_score}
                onBlur={(e) => handleNumberChange('matching', 'min_score', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>מקסימום התאמות לנכס</Label>
              <Input
                type="number"
                min={5}
                max={50}
                defaultValue={s.matching.max_matches_per_property}
                onBlur={(e) => handleNumberChange('matching', 'max_matches_per_property', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>אחוז גמישות מחיר מעל תקציב (%)</Label>
            <Input
              type="number"
              min={5}
              max={30}
              defaultValue={s.matching.flexible_price_threshold * 100}
              onBlur={(e) => handleNumberChange('matching', 'flexible_price_threshold', String(parseFloat(e.target.value) / 100))}
            />
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
