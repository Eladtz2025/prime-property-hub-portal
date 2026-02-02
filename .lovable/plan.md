

## תיקון כפילויות חוצות מקורות (Cross-Source Duplicates)

### בעיות שזוהו

| בעיה | היקף | דוגמה |
|------|------|-------|
| **כפילויות חוצות מקורות** | 352 זוגות | דירה ב"בארי" מופיעה גם ביד2 וגם במדלן |
| **לקוח רואה כפילויות** | 59 נכסים כפולים עם התאמות | Ziv Yogev רואה את אותה דירה פעמיים |
| **is_private שונה לאותו נכס** | ~100+ | יד2: פרטי, מדלן: לא ידוע |
| **שכונה שונה לאותו נכס** | ~100+ | יד2: "מרכז העיר", מדלן: "צפון ישן" |

---

### דוגמה קונקרטית - דירה ב"קליי"

| מקור | ID | שכונה | פרטי? | לקוחות מותאמים |
|------|-----|-------|------|----------------|
| **Yad2** | 145e72ce... | צפון חדש | false | Ziv, Shaul, Eli, Itay, סימונה |
| **Madlan** | b7fd81ac... | צפון חדש | null | Ziv, Shaul, Eli, Itay, סימונה |

**הלקוח רואה את אותה דירה פעמיים!**

---

### פתרון מוצע - 2 חלקים

#### חלק 1: ניקוי כפילויות קיימות (Migration)

SQL לאיחוד כפילויות חוצות מקורות - שמירת הרשומה עם המידע העשיר יותר:

```sql
-- Step 1: Identify cross-source duplicates and mark older ones as inactive
WITH cross_source_duplicates AS (
  SELECT 
    a.id as keep_id,
    b.id as deactivate_id,
    a.source as keep_source,
    b.source as deactivate_source,
    -- Keep the one with more features data
    CASE 
      WHEN jsonb_typeof(a.features) = 'object' AND 
           (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(a.features, '{}'::jsonb))) >
           (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(b.features, '{}'::jsonb)))
      THEN a.id
      ELSE b.id
    END as best_id
  FROM scouted_properties a
  JOIN scouted_properties b ON 
    a.city = b.city AND
    a.address = b.address AND
    a.rooms = b.rooms AND
    ABS(COALESCE(a.price, 0) - COALESCE(b.price, 0)) < 500
  WHERE a.is_active = true 
    AND b.is_active = true
    AND a.source != b.source  -- Different sources
    AND a.id < b.id  -- Avoid duplicate pairs
    AND a.address IS NOT NULL
    AND a.address != ''
)
UPDATE scouted_properties
SET is_active = false, status = 'duplicate_cross_source'
WHERE id IN (
  SELECT 
    CASE WHEN keep_id = best_id THEN deactivate_id ELSE keep_id END
  FROM cross_source_duplicates
);
```

#### חלק 2: מניעת כפילויות עתידיות (property-helpers.ts)

שינוי ב-upsert logic לבדוק כפילויות **לפי כתובת** גם כשהמקור שונה:

**קובץ:** `supabase/functions/_shared/property-helpers.ts`

לפני ה-insert, בדיקה אם קיים נכס דומה ממקור אחר:

```typescript
// Check for cross-source duplicates before inserting
async function findCrossSourceDuplicate(
  supabase: any,
  property: ScoutedPropertyInput
): Promise<string | null> {
  if (!property.address || !property.city || !property.rooms) {
    return null;
  }

  const { data: existing } = await supabase
    .from('scouted_properties')
    .select('id, source, source_url')
    .eq('city', property.city)
    .eq('address', property.address)
    .eq('rooms', property.rooms)
    .eq('is_active', true)
    .neq('source', property.source)  // Different source
    .limit(1)
    .maybeSingle();

  return existing?.id || null;
}

// In saveScoutedProperties function - before insert:
const crossSourceDuplicate = await findCrossSourceDuplicate(supabase, property);
if (crossSourceDuplicate) {
  console.log(`[property-helpers] Cross-source duplicate found: ${crossSourceDuplicate}`);
  // Update existing instead of creating new
  duplicateCount++;
  continue; // Skip this property
}
```

---

### סיכום השינויים

| קובץ | שינוי |
|------|-------|
| Migration SQL | השבתת ~350 כפילויות חוצות מקורות |
| `property-helpers.ts` | בדיקת כפילויות לפי כתובת (לא רק source_url) |
| Edge function call | הפעלת trigger-matching מחדש |

---

### תוצאות צפויות

| מצב | לפני | אחרי |
|-----|------|------|
| כפילויות חוצות מקורות | 352 | 0 |
| נכסים כפולים עם התאמות | 59 | 0 |
| לקוח רואה כפילויות | כן | לא |

---

### הערה חשובה

הלוגיקה של **outdoor space** ו-**balcony mandatory** עובדת נכון! הבעיה שדיווחת עליה (לקוח עם דרישת מרפסת/גג/חצר שרואה נכסים בלי) כנראה נובעת מ:

1. **הלקוח סימן flexible=true** (כמו Ziv Yogev) - אז זה תקין
2. **או שזו כפילות** - אותו נכס מופיע פעמיים עם מידע שונה

הבדיקות שעשיתי מראות שכל הלקוחות עם דרישות **חובה** (flexible=false) מקבלים רק נכסים תואמים.

