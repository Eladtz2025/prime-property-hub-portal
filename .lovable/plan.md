

# תוכנית: תיקון נכסים מחוץ לתל אביב + תיקון Backfill תקוע

## מצב נוכחי

| בעיה | סטטוס |
|------|-------|
| Backfill תקוע | `status: running` אבל לא זז כבר 40+ דקות |
| נכס מבת ים | 1 נכס פעיל (ID: `f7dd66e1-eefe-4558-99c6-d4d810591b2c`) |
| נכסים ללא עיר | 0 |

## פעולות נדרשות

### 1. תיקון ישיר בDB (Migration)

אבצע migration שיעשה:
1. **כיבוי הנכס מבת ים** - עדכון `is_active = false`
2. **סימון ה-backfill כעצור** - עדכון `status = 'stopped'`
3. **יצירת trigger למניעה עתידית** - trigger שמונע שמירת נכסים לא מתל אביב

```sql
-- Deactivate the Bat Yam property
UPDATE scouted_properties
SET is_active = false
WHERE id = 'f7dd66e1-eefe-4558-99c6-d4d810591b2c';

-- Stop the stuck backfill task
UPDATE backfill_progress
SET 
  status = 'stopped',
  completed_at = NOW(),
  updated_at = NOW()
WHERE id = '88907474-9435-440f-ac68-f516ecff9594'
  AND status = 'running';

-- Deactivate ANY non-Tel Aviv properties (safety net)
UPDATE scouted_properties
SET is_active = false
WHERE is_active = true
  AND city IS NOT NULL
  AND city NOT LIKE '%תל אביב%'
  AND city NOT LIKE '%תל-אביב%'
  AND city NOT LIKE '%Tel Aviv%';

-- Create trigger to prevent non-Tel Aviv properties
CREATE OR REPLACE FUNCTION check_tel_aviv_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip check if city is null (will be filled by backfill)
  IF NEW.city IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if city is Tel Aviv
  IF NEW.city NOT LIKE '%תל אביב%' 
     AND NEW.city NOT LIKE '%תל-אביב%'
     AND NEW.city NOT LIKE '%Tel Aviv%' THEN
    -- Instead of error, just mark as inactive
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_tel_aviv_only ON scouted_properties;
CREATE TRIGGER enforce_tel_aviv_only
  BEFORE INSERT OR UPDATE ON scouted_properties
  FOR EACH ROW
  EXECUTE FUNCTION check_tel_aviv_only();
```

### 2. עדכון property-helpers.ts

נוסיף בדיקת עיר **לפני** שמירה:

```typescript
// In saveProperty function
const normalizedCity = normalizeCityName(property.city);

// Validate Tel Aviv only
const isTelAviv = normalizedCity && 
  (normalizedCity.includes('תל אביב') || normalizedCity.includes('תל-אביב'));

if (normalizedCity && !isTelAviv) {
  console.log(`🚫 Skipping non-Tel Aviv property: ${normalizedCity}`);
  return { isNew: false, skipped: true };
}
```

---

## סיכום

| פעולה | מה יקרה |
|-------|---------|
| Migration | יכבה את נכס בת ים + יעצור backfill + יוסיף trigger |
| property-helpers | ימנע שמירת נכסים לא מתל אביב מלכתחילה |
| Trigger | רשת ביטחון - נכסים לא מתל אביב יסומנו כלא פעילים |

