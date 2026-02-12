
# הוספת כל התהליכים למוניטור החי

## הבעיה

המוניטור מציג רק 3 תהליכים:
- סריקות (מ-`scout_runs`)
- זמינות (מ-`availability_check_runs`)
- השלמת נתונים (מ-`backfill_progress` WHERE task_name = `data_completion` **בלבד**)

תהליכים שלא מופיעים כלל:
- כפילויות (`dedup-scan`)
- סיווג מתווך (`reclassify_broker`)
- השלמות אוטומטיות (`data_completion_auto_yad2`, `data_completion_auto_madlan`, `data_completion_auto_homeless`)

## הפתרון

### שלב 1: LiveMonitor — שאילתה גנרית לכל backfill_progress

במקום לשאול רק על `task_name = 'data_completion'`, נשאל על **כל** המשימות שרצות:

```text
FROM backfill_progress
WHERE status = 'running'
ORDER BY started_at DESC
```

כל משימה רצה תופיע כשורה נפרדת בסרגל התהליכים הפעילים (Active Processes) עם שם תצוגה בעברית, אייקון מתאים, ו-progress bar.

### שלב 2: מיפוי שמות משימות לתצוגה

| task_name | תווית | אייקון | סוג בפיד |
|-----------|--------|--------|----------|
| data_completion | השלמת נתונים | Database | backfill |
| data_completion_auto_* | השלמה אוטו [source] | Database | backfill |
| dedup-scan | סריקת כפילויות | Copy | dedup |
| reclassify_broker | סיווג מתווך | Users | backfill |
| backfill_broker_classification | סיווג מתווך (ישן) | Users | backfill |

### שלב 3: עדכון Edge Function `detect-duplicates`

כרגע ה-Edge Function כותב רק סטטיסטיקות מצטברות ל-`summary_data`:
```json
{ "duplicates_found": 15, "groups_created": 8, "batches": 3 }
```

נוסיף `recent_batches` — רשימה של 10 ה-batches האחרונים:
```json
{
  "duplicates_found": 15,
  "groups_created": 8,
  "batches": 3,
  "recent_batches": [
    {
      "batch": 3,
      "processed": 500,
      "duplicates": 5,
      "groups": 2,
      "timestamp": "2026-02-12T18:30:00Z"
    }
  ]
}
```

### שלב 4: LiveMonitor — הצגת פיד כפילויות

כל batch של כפילויות יוצג כשורה בפיד:
- **Primary**: `Batch 3 — כפילויות`
- **Details**: `500 נבדקו | 5 כפילויות | 2 קבוצות חדשות`
- **Status**: ok (אם נמצאו כפילויות), warning (אם 0)

צבע ואייקון: סגול (Copy icon) — `bg-purple-950/30 border-r-purple-500/40`

## פרטים טכניים

### LiveMonitor.tsx

1. שינוי שאילתת backfill מ:
```typescript
.eq('task_name', 'data_completion')
```
ל:
```typescript
.eq('status', 'running')
// ללא סינון task_name — מחזיר את כל הרצים
```

2. הוספת typeConfig:
```typescript
dedup: { icon: Copy, label: 'כפילויות', bgClass: 'bg-purple-950/30 border-r-2 border-r-purple-500/40' }
```

3. הוספת interface `DedupBatchItem` ולוגיקת בניית feed items מ-`recent_batches`

4. הוספת `taskNameToLabel` map לשמות תצוגה בעברית בסרגל Active Processes

5. לולאה על כל הרצים (לא רק אחד) — כל אחד מקבל שורה בסרגל + feed items

### detect-duplicates/index.ts

עדכון `summary_data` בכל batch כדי לכלול `recent_batches` (שומר 10 אחרונים):
```typescript
const recentBatches = existingSummary?.recent_batches || [];
recentBatches.push({
  batch: batchCount,
  processed,
  duplicates,
  groups,
  timestamp: new Date().toISOString(),
});
// Keep only last 10
if (recentBatches.length > 10) recentBatches.splice(0, recentBatches.length - 10);
```

צריך לקרוא את ה-summary_data הקיים לפני כל עדכון כדי לא לדרוס.

### קבצים שישתנו:
- `src/components/scout/checks/LiveMonitor.tsx`
- `supabase/functions/detect-duplicates/index.ts`

### Deploy:
- detect-duplicates
