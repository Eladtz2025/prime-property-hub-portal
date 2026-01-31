
# ניקוי ותיקון מערכת השלמת הנתונים

## מצב נוכחי

### סיכום מערכות הבקפיל:

| שם טאסק | סטטוס | בעיה | פעולה |
|---------|-------|------|-------|
| `backfill_entry_dates` | 🔴 running (תקוע) | 45/2118 - לא זז כ-2 שעות | **למחוק** - entry_date לא קיים ב-DB |
| `backfill_entry_dates_fast` | 🔴 running (תקוע) | 30/2598 - לא זז כ-6 שעות | **למחוק** - entry_date לא קיים ב-DB |
| `data_completion` | ⬛ stopped | 60/7779 - נעצר ידנית | **לתקן** - זו המערכת הנכונה |
| `data_completion_auto_*` | ✅ completed | עובד טוב אחרי סריקות | **לשמור** |

### הבעיה המרכזית:

**פונקציות entry_date מיותרות לחלוטין!**

1. אין עמודת `entry_date` בטבלת `scouted_properties`
2. הן מנסות לעדכן שדה `features.entry_date` שלא קיים
3. צורכות Firecrawl credits + Lovable AI credits לשווא
4. תופסות מקום ב-UI ומבלבלות

---

## תוכנית ניקוי - 4 שלבים

### שלב 1: מחיקת Edge Functions מיותרות

**למחיקה:**
- `supabase/functions/backfill-entry-dates/` - 480 שורות קוד מיותר
- `supabase/functions/backfill-entry-dates-fast/` - 566 שורות קוד מיותר

**סך הכל:** ~1,050 שורות קוד למחיקה

### שלב 2: ניקוי config.toml

הסרת רשומות:
```toml
[functions.backfill-entry-dates-fast]
verify_jwt = false

[functions.backfill-entry-dates]
verify_jwt = false

[functions.match-scouted-to-leads]  # כבר נמחק קודם
verify_jwt = false

[functions.reset-all-matches]  # כבר נמחק קודם
verify_jwt = false
```

### שלב 3: ניקוי רשומות תקועות ב-DB

```sql
-- מחיקת רשומות backfill_progress תקועות
DELETE FROM backfill_progress 
WHERE task_name IN ('backfill_entry_dates', 'backfill_entry_dates_fast')
   OR (status = 'running' AND updated_at < NOW() - INTERVAL '30 minutes');
```

### שלב 4: עדכון UI (UnifiedScoutSettings.tsx)

הסרת:
- כל הפונקציות הקשורות ל-`backfill-entry-dates`
- כפתורי "עדכון תאריכי כניסה" ו-"עדכון מהיר"
- הסטייט המיותר: `isBackfilling`, `isFastBackfilling`
- ~150 שורות קוד UI

---

## תיקון מערכת data_completion

### בעיה זוהתה:
הפונקציה `backfill-property-data` נתקעה אחרי 60 נכסים - הסיבה הסבירה:
1. לולאה סינכרונית איטית (1.5 שניות delay בין כל נכס)
2. 60 נכסים × 1.5 שניות = 90 שניות → **timeout!**

### פתרון - שינוי לארכיטקטורת self-trigger:

```typescript
// backfill-property-data/index.ts
const MAX_ITEMS_PER_RUN = 20;  // עיבוד 20 נכסים ואז self-trigger

// בסוף העיבוד:
if (hasMoreItems) {
  // Fire and forget self-trigger for continuation
  fetch(`${supabaseUrl}/functions/v1/backfill-property-data`, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({ action: 'continue', task_id: progressId })
  });
}
```

---

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/functions/backfill-entry-dates/index.ts` | 🗑️ **מחיקה** |
| `supabase/functions/backfill-entry-dates-fast/index.ts` | 🗑️ **מחיקה** |
| `supabase/config.toml` | ✏️ הסרת רשומות מיותרות |
| `src/components/scout/UnifiedScoutSettings.tsx` | ✏️ הסרת UI של entry_dates |
| `supabase/functions/backfill-property-data/index.ts` | ✏️ הוספת self-trigger |

---

## תוצאה צפויה

1. **קוד נקי יותר:** הסרת ~1,200 שורות קוד מיותר
2. **חיסכון בעלויות:** ללא קריאות Firecrawl/AI מיותרות
3. **מערכת אחת ברורה:** רק `backfill-property-data` לכל השלמת הנתונים
4. **עמידות ב-timeout:** self-triggering מבטיח שהתהליך תמיד מסתיים

---

## רכיבים לשימור (עובדים טוב)

- ✅ `backfill-property-data` - המערכת הראשית (עם תיקון)
- ✅ Auto-backfill אחרי סריקות (`data_completion_auto_*`)
- ✅ `useBackfillProgress` hook - עוקב אחרי `data_completion`
- ✅ `cleanup-stuck-runs` - מנקה תהליכים תקועים
