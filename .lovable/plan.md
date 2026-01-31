

# תיקון: הסתרת נכסים לא פעילים + שיפור השלמת נתונים

## בעיות שזוהו

| בעיה | סיבה | פתרון |
|------|------|-------|
| נכסים לא פעילים מוצגים | `applyFilters` לא מסנן לפי `is_active = true` | הוספת פילטר קבוע |
| Backfill נתקע | timeout בודד יכול לעצור את כל התהליך | שיפור ניהול שגיאות |

## שינויים נדרשים

### 1. הוספת פילטר `is_active = true` לשאילתות (ScoutedPropertiesTable.tsx)

**בפונקציית `applyFilters`** - שורה 501:
```typescript
const applyFilters = (query: any, filters: NonNullable<typeof appliedFilters>) => {
  // Always filter for active properties only
  query = query.eq('is_active', true);  // ← הוספה חדשה
  
  // Always filter for Tel Aviv
  query = query.ilike('city', '%תל אביב%');
  // ... rest of filters
```

**בסטטיסטיקות** - שורות 322-346:
- הוספת `.eq('is_active', true)` לכל השאילתות של totalCount, todayCount, weekCount

**בשאילתות נוספות**:
- שאילתת neighborhoods (שורה 489)

### 2. שיפור Edge Function של Backfill

**בדיקת task קיים יותר חכמה** - אם task נתקע יותר מ-10 דקות, לסמן כ-stopped אוטומטית:
```typescript
// Check for stuck running tasks (older than 10 minutes)
if (existingTask) {
  const taskAge = Date.now() - new Date(existingTask.updated_at).getTime();
  const isStuck = taskAge > 10 * 60 * 1000; // 10 minutes
  
  if (isStuck) {
    // Auto-stop stuck task
    await supabase.from('backfill_progress').update({
      status: 'stopped',
      error_message: 'Task was stuck for 10+ minutes, auto-stopped'
    }).eq('id', existingTask.id);
  } else if (!auto_trigger) {
    return { message: 'Task already running', task_id: existingTask.id };
  }
}
```

**טיפול טוב יותר בשגיאות Firecrawl** - המשך לנכס הבא במקום לעצור:
```typescript
try {
  const scrapeResponse = await fetch(...);
  // ...
} catch (propError) {
  console.error(`Error processing ${prop.id}:`, propError);
  failCount++;
  lastId = prop.id;
  // Continue to next property - don't stop the batch
  continue;
}
```

## סיכום השינויים

| קובץ | פעולה |
|------|-------|
| `ScoutedPropertiesTable.tsx` | הוספת `is_active = true` לכל השאילתות |
| `backfill-property-data/index.ts` | זיהוי ותיקון אוטומטי של tasks תקועים |

## תוצאה צפויה

- רק נכסים פעילים יוצגו בטבלה (7,630 במקום 7,900)
- כפתור השלמת נתונים יעבוד ללא תקיעות
- אם task נתקע - יתוקן אוטומטית בהפעלה הבאה

