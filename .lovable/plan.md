
# תיקון בעיות + כפתור "הרץ הכל" לפי מקור

## הבעיות שזיהיתי

### בעיה 1: שתי שעות בטופס העריכה למרות שעה אחת ב-DB
**הסיבה**: כשפותחים טופס עריכה, הקוד ממלא אוטומטית את השדה השני מברירת המחדל של המקור:
```typescript
// שורה 634-635 הנוכחית
schedule_time_1: configSchedule?.[0] ?? defaultSchedule[0],
schedule_time_2: configSchedule?.[1] ?? defaultSchedule[1], // ← ממלא מברירת מחדל!
```

**הפתרון**: לא למלא את השדה השני אם אין ערך ב-DB:
```typescript
schedule_time_2: configSchedule?.[1] || '', // ← ריק אם אין
```

### בעיה 2: חסר כפתור "הרץ הכל" לכל מקור
**הבקשה**: להוסיף כפתור Play בכותרת של כל עמודה שמריץ את כל הקונפיגורציות של אותו מקור ברצף, עם הפרש של 5 דקות בין כל אחת.

---

## שינויים בקוד

### קובץ: `src/components/scout/UnifiedScoutSettings.tsx`

#### שינוי 1: תיקון מילוי שעה שנייה בטופס עריכה

**לפני** (שורה 635):
```typescript
schedule_time_2: configSchedule?.[1] ?? defaultSchedule[1],
```

**אחרי**:
```typescript
schedule_time_2: configSchedule?.[1] || '',
```

#### שינוי 2: הוספת פונקציה להרצת כל הקונפיגורציות של מקור

```typescript
// Function to run all configs of a source sequentially with 5 min delay
const [runningSource, setRunningSource] = useState<string | null>(null);

const runAllSourceConfigs = async (source: string) => {
  const sourceConfigs = configs?.filter(c => c.source === source && c.is_active) || [];
  
  if (sourceConfigs.length === 0) {
    toast.warning('אין קונפיגורציות פעילות למקור זה');
    return;
  }

  setRunningSource(source);
  toast.info(`מתחיל להריץ ${sourceConfigs.length} קונפיגורציות של ${source}...`);

  for (let i = 0; i < sourceConfigs.length; i++) {
    const config = sourceConfigs[i];
    
    try {
      await runConfigMutation.mutateAsync(config.id);
      toast.success(`הופעלה: ${config.name} (${i + 1}/${sourceConfigs.length})`);
      
      // Wait 5 minutes before next (except for the last one)
      if (i < sourceConfigs.length - 1) {
        toast.info(`ממתין 5 דקות לפני הבא...`);
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes
      }
    } catch (error) {
      console.error(`Failed to run ${config.name}:`, error);
      toast.error(`שגיאה בהפעלת ${config.name}`);
    }
  }

  setRunningSource(null);
  toast.success(`הושלמו כל ${sourceConfigs.length} הריצות של ${source}!`);
};
```

#### שינוי 3: הוספת כפתור Play לכותרת כל עמודה

**כותרת עמודת הומלס לדוגמה** (דומה לשאר):
```tsx
<div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border-r-4 border-r-purple-500">
  <div className="flex items-center gap-2">
    <span className="font-semibold text-purple-700 dark:text-purple-400">הומלס</span>
    <Badge variant="outline" className="bg-purple-500/20">
      {configs.filter(c => c.source === 'homeless').length}
    </Badge>
  </div>
  <div className="flex items-center gap-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-purple-600 hover:bg-purple-500/20"
            onClick={() => runAllSourceConfigs('homeless')}
            disabled={runningSource !== null}
          >
            {runningSource === 'homeless' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>הרץ את כל ההומלס (5 דק׳ הפרש)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</div>
```

---

## לגבי שאלה 3 - העיר לא נבחרה

בדקתי את ה-DB וכל הקונפיגורציות החדשות שיצרנו **כן מכילות עיר** (`תל אביב יפו`):

| Name | Cities | Neighborhoods |
|------|--------|---------------|
| Homeless דרום - השכרה | `["תל אביב יפו"]` | `["homeless_תא_דרום"]` |
| Yad2 צפון ישן - השכרה | `["תל אביב יפו"]` | `["yad2_צפון_ישן"]` |

**מה שראית בתמונה**: כנראה זו קונפיגורציה ישנה או שהשדה "ערים" נראה ריק כי הוא dropdown שלא נבחר עדיין (בזמן עריכה/יצירה).

**ככה זה אמור לעבוד**: השכונה מכילה את העיר בשם שלה (למשל `homeless_תא_דרום`), והמערכת יודעת לפרש את זה נכון. אבל עדיף שגם שדה העיר יהיה מלא.

---

## תוצאה צפויה

1. **טופס עריכה**: יציג רק את השעות שבאמת קיימות ב-DB (לא ימלא אוטומטית שעה שנייה)

2. **כפתור Play בכותרת**: בלחיצה על Play בכותרת "הומלס" - יריץ את כל 10 הקונפיגורציות של הומלס אחת אחרי השנייה עם הפרש 5 דקות

3. **אינדיקציה ויזואלית**: הכפתור יהפוך ל-Spinner בזמן ההמתנה + הודעות Toast על ההתקדמות

---

## סיכום

| שינוי | תיאור |
|-------|-------|
| תיקון openEditDialog | לא למלא שעה שנייה מברירת מחדל |
| הוספת runAllSourceConfigs | פונקציה שמריצה כל קונפיגורציות מקור ברצף |
| עדכון כותרות עמודות | הוספת כפתור Play + Tooltip לכל מקור |
