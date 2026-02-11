
# דשבורד בדיקות זמינות - גרסה קומפקטית עם מעקב לייב

## מה ישתנה

### הסרה
- `AvailabilityStats.tsx` (גרפי Pie/Bar) - יימחק
- `AvailabilityTimeline.tsx` (ציר זמן Scatter) - יימחק  
- `AvailabilityLogs.tsx` (placeholder ללוגים) - יימחק

### הוספה - מעקב לייב אחרי בדיקות
הרעיון המרכזי: כשריצה פעילה (status=running), ה-Edge Function יעדכן את `run_details` ב-DB **אחרי כל נכס** (לא רק בסוף). ה-UI יעשה polling מהיר (כל 3 שניות) ויציג פיד לייב של מה שנבדק ומה התוצאה.

## מבנה UI חדש (קומפקטי)

```text
+--------------------------------------------------+
| סטטיסטיקות (4 כרטיסים קטנים - נשאר כמו שיש)     |
+--------------------------------------------------+
| פעולות: [הפעל ריצה] [אפס Timeouts] [בדוק URL]   |
+--------------------------------------------------+
| בדיקה חיה (מופיע רק כשיש ריצה פעילה)             |
| ┌──────────────────────────────────────────────┐  |
| │ ● רץ כעת... 4/18 נכסים | 2 אקטיביים 1 הוסר │  |
| │ ✓ רוטשילד 42, תל אביב (yad2) - אקטיבי       │  |
| │ ✗ בן יהודה 15 (madlan) - הוסר                │  |
| │ ⏳ בודק: דיזנגוף 99 (yad2)...               │  |
| └──────────────────────────────────────────────┘  |
+--------------------------------------------------+
| היסטוריית ריצות (טבלה קומפקטית - נשאר + קליק     |
| לפירוט)                                          |
+--------------------------------------------------+
| תוצאות אחרונות (טבלה עם סינון - נשאר)            |
+--------------------------------------------------+
| הגדרות (collapsible - נשאר)                       |
+--------------------------------------------------+
```

## פירוט טכני

### 1. Edge Function: עדכון run_details בזמן אמת

**קובץ: `supabase/functions/check-property-availability/index.ts`**

אחרי כל נכס שנבדק, לעדכן את ה-`run_details` של ה-run הפעיל. הפונקציה תקבל `run_id` כפרמטר נוסף מ-`trigger-availability-check`.

```typescript
// After each property check result:
if (runId) {
  // Append to run_details using jsonb concatenation
  await supabase.rpc('append_run_detail', {
    p_run_id: runId,
    p_detail: {
      property_id: result.id,
      source_url: prop?.source_url,
      address: prop?.title,
      source: prop?.source,
      reason: result.reason,
      is_inactive: result.isInactive,
      checked_at: new Date().toISOString()
    }
  });
}
```

**קובץ: `supabase/functions/trigger-availability-check/index.ts`**

יעביר את ה-`run_id` ל-`check-property-availability`:
```typescript
body: JSON.stringify({ property_ids: batch, run_id: runId })
```

### 2. DB Function: append_run_detail

מיגרציה חדשה - פונקציה שמוסיפה אלמנט ל-JSONB array בצורה אטומית:
```sql
CREATE OR REPLACE FUNCTION append_run_detail(p_run_id uuid, p_detail jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE availability_check_runs 
  SET run_details = COALESCE(run_details, '[]'::jsonb) || jsonb_build_array(p_detail),
      properties_checked = jsonb_array_length(COALESCE(run_details, '[]'::jsonb) || jsonb_build_array(p_detail))
  WHERE id = p_run_id;
END;
$$;
```

### 3. קומפוננטת לייב חדשה: `AvailabilityLiveFeed.tsx`

**מה עושה:**
- כשאין ריצה פעילה: לא מוצגת
- כשיש ריצה פעילה (status=running): מציגה פיד חי
- Polling כל 3 שניות של `run_details` מהריצה הפעילה
- מציגה Progress bar (X/Y נכסים)
- רשימת נכסים שנבדקו עם תוצאות (גוללת למטה אוטומטית)
- השורה האחרונה מהבהבת עם "בודק..." אם עדיין רץ

**שאילתה:**
```sql
SELECT run_details, properties_checked, started_at 
FROM availability_check_runs 
WHERE status = 'running' 
ORDER BY started_at DESC LIMIT 1
```

### 4. עדכון AvailabilityCheckDashboard.tsx

- הסרת imports של AvailabilityStats, AvailabilityTimeline, AvailabilityLogs
- הוספת AvailabilityLiveFeed בין הפעולות להיסטוריה
- שאר הקומפוננטות נשארות (סטטיסטיקות, פעולות, היסטוריה, תוצאות, הגדרות)

## קבצים

### למחיקה
- `src/components/scout/availability/AvailabilityStats.tsx`
- `src/components/scout/availability/AvailabilityTimeline.tsx`
- `src/components/scout/availability/AvailabilityLogs.tsx`

### חדשים
- `src/components/scout/availability/AvailabilityLiveFeed.tsx`

### לעדכון
- `src/components/scout/AvailabilityCheckDashboard.tsx` - הסרת גרפים, הוספת LiveFeed
- `supabase/functions/check-property-availability/index.ts` - קבלת run_id + עדכון DB אחרי כל נכס
- `supabase/functions/trigger-availability-check/index.ts` - העברת run_id לפונקציית הבדיקה
- מיגרציה - פונקציית `append_run_detail`
