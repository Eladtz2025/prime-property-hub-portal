
# תיקון תצוגת כפילויות בדשבורד

## מה מצאתי

בדיקת הכפילויות **עצמה עובדת מצוין**: יש 1,135 קבוצות כפילויות עם 2,436 נכסים. המנוע הפנימי (RPC) תקין לחלוטין.

**הבעיות הן בתצוגה בלבד:**

### בעיה 1: היסטוריה ריקה (DeduplicationStatus)
הקומפוננטה שמוצגת ב"היסטוריה" שואלת את טבלת `duplicate_alerts` שיש בה **0 רשומות**. הנתונים האמיתיים נמצאים ב-`backfill_progress` (task_name = 'dedup-scan') וב-`scouted_properties.duplicate_group_id`.

### בעיה 2: מספר קבוצות מנופח
השאילתה סופרת כמה נכסים יש להם `duplicate_group_id` (2,436) במקום כמה קבוצות ייחודיות (1,135). צריך `COUNT(DISTINCT duplicate_group_id)`.

### בעיה 3: סטטוס שגוי
כשאין נכסים לבדיקה (unchecked = 0), הסטטוס מראה "idle" במקום "completed". צריך לבדוק גם אם יש ריצה אחרונה.

### בעיה 4: פיד כפילויות במוניטור
כמו הבעיה שתיקנו לסריקות — כל batch מופיע כשורה נפרדת במקום שורה מסכמת אחת.

---

## שינויים מתוכננים

### קובץ 1: `src/components/scout/ChecksDashboard.tsx`

**תיקון ספירת קבוצות** — שימוש ב-RPC או שינוי השאילתה:
- במקום לספור שורות עם `duplicate_group_id IS NOT NULL`, להשתמש בשאילתה נפרדת שסופרת קבוצות ייחודיות
- כיוון ש-supabase-js לא תומך ב-COUNT DISTINCT ישירות, נשתמש ב-RPC קטן או נביא את הנתון מ-backfill_progress

**תיקון סטטוס הכרטיס** — הצגת "completed" כשהריצה האחרונה הסתיימה:
- קריאת `backfill_progress` עבור `dedup-scan` לקבלת last run info
- הצגת זמן ריצה אחרונה ותוצאות

### קובץ 2: `src/components/scout/checks/DeduplicationStatus.tsx`

**שכתוב מלא** — במקום לקרוא מ-`duplicate_alerts` (ריק), להציג:
- סטטיסטיקות מ-`scouted_properties`: קבוצות ייחודיות, נכסים כפולים, losers, unchecked
- היסטוריית ריצות מ-`backfill_progress` (task_name = 'dedup-scan')
- תוצאות ריצה אחרונה: כמה נבדקו, כמה כפילויות נמצאו, כמה קבוצות חדשות

### קובץ 3: `src/components/scout/checks/LiveMonitor.tsx`

**איחוד שורות dedup בפיד** — כמו שעשינו לסריקות:
- במקום שורה לכל batch, שורה מסכמת אחת לכל ריצת dedup
- הצגת: "סריקת כפילויות — באצ' 12/13 | 5,551 נבדקו | 2,020 כפילויות"

---

## פירוט טכני

### שינוי שאילתת dedupStats
```typescript
// שאילתה חדשה שמביאה גם distinct groups וגם last run
const [uncheckedRes, groupsDistinctRes, losersRes, checkedTodayRes, lastRunRes] = await Promise.all([
  supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).is('dedup_checked_at', null),
  supabase.rpc('count_duplicate_groups'),  // RPC חדש, או חלופה
  supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).eq('is_primary_listing', false).not('duplicate_group_id', 'is', null),
  supabase.from('scouted_properties').select('id', { count: 'exact', head: true }).gte('dedup_checked_at', today.toISOString()),
  supabase.from('backfill_progress').select('*').eq('task_name', 'dedup-scan').maybeSingle(),
]);
```

**חלופה ללא RPC:** להשתמש ב-summary_data מ-backfill_progress שכבר מכיל groups_created, או לחשב מצד הלקוח.

### שכתוב DeduplicationStatus
- הצגת 3 כרטיסי סטטיסטיקה: קבוצות כפילויות, נכסים כפולים (losers), ממתינים לבדיקה
- טבלת היסטוריית ריצות מ-backfill_progress (כל הריצות שלdedup-scan)
- תוצאות הריצה האחרונה כולל recent_batches

### איחוד פיד LiveMonitor
```typescript
if (taskCfg.feedType === 'dedup') {
  const recentBatches = summary?.recent_batches || [];
  if (recentBatches.length > 0) {
    const lastBatch = recentBatches[recentBatches.length - 1];
    const totalProcessed = run.processed_items ?? 0;
    const totalDups = run.successful_items ?? 0;
    feedItems.push({
      type: 'dedup',
      timestamp: lastBatch.timestamp,
      primary: `סריקת כפילויות — באצ׳ ${lastBatch.batch}`,
      details: `${totalProcessed} נבדקו | ${totalDups} כפילויות`,
      status: run.status === 'completed' ? 'ok' : 'warning',
    });
  }
}
```

| קובץ | שינוי |
|---|---|
| `ChecksDashboard.tsx` | תיקון ספירת groups (distinct), הוספת last run, תיקון סטטוס |
| `DeduplicationStatus.tsx` | שכתוב — מעבר מ-duplicate_alerts ל-backfill_progress + scouted_properties |
| `LiveMonitor.tsx` | איחוד שורות dedup לשורה מסכמת אחת |
