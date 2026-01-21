import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useScoutSettings, useUpdateScoutSetting, defaultSettings } from "@/hooks/useScoutSettings";
import { Loader2, Settings, Search, Copy, Calculator, Calendar, RefreshCw, Database, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
export function ScoutSettingsPanel() {
  const { data: settings, isLoading } = useScoutSettings();
  const updateSetting = useUpdateScoutSetting();
  const queryClient = useQueryClient();
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isFastBackfilling, setIsFastBackfilling] = useState(false);

  // Query backfill progress (both regular and fast)
  const { data: backfillProgress, refetch: refetchProgress } = useQuery({
    queryKey: ['backfill-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backfill_progress')
        .select('*')
        .in('task_name', ['backfill_entry_dates', 'backfill_entry_dates_fast'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    refetchInterval: (isBackfilling || isFastBackfilling) ? 2000 : false
  });

  const handleBackfillEntryDates = async () => {
    try {
      setIsBackfilling(true);
      toast.info('מתחיל עדכון תאריכי כניסה...');

      // Start the backfill process
      const { data, error } = await supabase.functions.invoke('backfill-entry-dates', {
        body: { batch_size: 10 }
      });

      if (error) throw error;

      if (data.completed) {
        toast.success('עדכון תאריכי כניסה הושלם!');
        setIsBackfilling(false);
      } else if (data.hasMore) {
        toast.success(`עובד ${data.processed} נכסים. ממשיך...`);
        // Continue with next batch after a delay
        setTimeout(() => continueBackfill(data.lastProcessedId), 1000);
      } else {
        toast.success(`עדכון הושלם: ${data.successful} הצליחו, ${data.failed} נכשלו`);
        setIsBackfilling(false);
      }

      refetchProgress();
    } catch (err: any) {
      console.error('Backfill error:', err);
      toast.error(`שגיאה בעדכון: ${err.message}`);
      setIsBackfilling(false);
    }
  };

  const continueBackfill = async (continueFrom: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('backfill-entry-dates', {
        body: { batch_size: 10, continue_from: continueFrom }
      });

      if (error) throw error;

      refetchProgress();

      if (data.completed || !data.hasMore) {
        toast.success(`עדכון הושלם: ${backfillProgress?.successful_items || 0} הצליחו`);
        setIsBackfilling(false);
      } else {
        // Continue with next batch
        setTimeout(() => continueBackfill(data.lastProcessedId), 1000);
      }
    } catch (err: any) {
      console.error('Backfill continue error:', err);
      toast.error(`שגיאה בהמשך העדכון: ${err.message}`);
      setIsBackfilling(false);
    }
  };

  // Fast backfill with Regex-first approach
  const handleFastBackfill = async () => {
    try {
      setIsFastBackfilling(true);
      toast.info('מתחיל עדכון מהיר (Regex + AI)...');

      const { data, error } = await supabase.functions.invoke('backfill-entry-dates-fast', {
        body: { batch_size: 50, use_ai_fallback: true }
      });

      if (error) throw error;

      refetchProgress();

      if (data.completed) {
        toast.success('עדכון מהיר הושלם!');
        setIsFastBackfilling(false);
      } else if (data.hasMore) {
        const regexPct = data.processed > 0 ? Math.round((data.regexHits / data.processed) * 100) : 0;
        toast.success(`עובד ${data.processed} נכסים (${regexPct}% Regex). ממשיך...`);
        setTimeout(() => continueFastBackfill(), 500);
      } else {
        toast.success(`עדכון הושלם: ${data.successful} הצליחו, Regex: ${data.regexHits}, AI: ${data.aiHits}`);
        setIsFastBackfilling(false);
      }
    } catch (err: any) {
      console.error('Fast backfill error:', err);
      toast.error(`שגיאה: ${err.message}`);
      setIsFastBackfilling(false);
    }
  };

  const continueFastBackfill = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('backfill-entry-dates-fast', {
        body: { batch_size: 50, use_ai_fallback: true }
      });

      if (error) throw error;

      refetchProgress();

      if (data.completed || !data.hasMore) {
        toast.success(`עדכון מהיר הושלם! Regex: ${data.regexHits || 0}, AI: ${data.aiHits || 0}`);
        setIsFastBackfilling(false);
      } else {
        setTimeout(() => continueFastBackfill(), 500);
      }
    } catch (err: any) {
      console.error('Fast backfill continue error:', err);
      toast.error(`שגיאה בהמשך: ${err.message}`);
      setIsFastBackfilling(false);
    }
  };

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
  const progressPercent = backfillProgress?.total_items 
    ? Math.round((backfillProgress.processed_items / backfillProgress.total_items) * 100)
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Backfill Entry Dates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            עדכון תאריכי כניסה לנכסים קיימים
          </CardTitle>
          <CardDescription>
            סריקה מחדש של נכסי שכירות קיימים לחילוץ תאריכי כניסה מהמקור
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backfillProgress && backfillProgress.status === 'running' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>התקדמות</span>
                <span>{backfillProgress.processed_items} / {backfillProgress.total_items}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-primary">הצליחו: {backfillProgress.successful_items || 0}</span>
                <span className="text-destructive">נכשלו: {backfillProgress.failed_items || 0}</span>
              </div>
            </div>
          )}
          
          {backfillProgress && backfillProgress.status === 'completed' && (
            <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm">
              העדכון האחרון הושלם: {backfillProgress.successful_items} הצליחו, {backfillProgress.failed_items} נכשלו
            </div>
          )}

          {backfillProgress && backfillProgress.status === 'failed' && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              העדכון נכשל: {backfillProgress.error_message}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleFastBackfill}
              disabled={isBackfilling || isFastBackfilling}
              className="flex-1"
              variant="default"
            >
              {isFastBackfilling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  עדכון מהיר...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  עדכון מהיר (Regex + AI)
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleBackfillEntryDates}
              disabled={isBackfilling || isFastBackfilling}
              variant="outline"
              size="icon"
              title="עדכון מלא (איטי יותר)"
            >
              {isBackfilling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            <strong>מהיר:</strong> Regex קודם (~5 שניות/נכס), AI רק אם צריך. 
            <strong> מלא:</strong> AI לכולם (~2 דק/נכס).
          </p>
        </CardContent>
      </Card>

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
