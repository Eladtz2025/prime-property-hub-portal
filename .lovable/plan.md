

## תיקון באג כפילויות והתאמות שגויות

### בעיות שזוהו בבדיקת 90 ההתאמות של "זיו יוגב"

| בעיה | היקף | השפעה |
|------|------|-------|
| **כפילויות source_url** | 285 זוגות (160 Madlan, 125 Homeless) | נכס מופיע 2+ פעמים בתוצאות |
| **source_id לא עקבי** | כל ה-285 | `X` vs `madlan_X` - לא מתמזג ב-upsert |
| **is_private שונה לאותו נכס** | 6 רשומות בזיו | תיווך vs פרטי על אותו נכס |
| **שם ברוקר בכתובת** | 1 רשומה | `LEAD שיווק נדל"ן` בשדה address |
| **is_private = null** | 45% מהתוצאות | לא יודעים אם תיווך או פרטי |

---

### פתרון מוצע - 3 חלקים

#### חלק 1: ניקוי כפילויות קיימות (Migration)

מחיקת הרשומות הכפולות ושמירת הרשומה עם המידע המלא יותר:

```sql
-- Deduplicate by keeping the newer record (usually has better data)
WITH duplicates AS (
  SELECT 
    source_url,
    array_agg(id ORDER BY created_at DESC) as ids
  FROM scouted_properties
  WHERE is_active = true
  GROUP BY source_url
  HAVING COUNT(*) > 1
)
UPDATE scouted_properties
SET is_active = false
WHERE id IN (
  SELECT unnest(ids[2:]) -- Keep first (newest), deactivate rest
  FROM duplicates
);
```

#### חלק 2: תיקון source_id generation

שינוי `parser-madlan.ts` לייצר source_id עקבי **בלי prefix**:

**קובץ:** `supabase/functions/_experimental/parser-madlan.ts`
**שורה 495:**

```typescript
// לפני
source_id: `madlan_${sourceId}`,

// אחרי - שימוש ב-source_url כ-source_id לעקביות מלאה
source_id: sourceId,  // ה-listing ID המקורי בלי prefix
```

#### חלק 3: שינוי upsert logic להתבסס על source_url

שינוי `property-helpers.ts` לבדוק כפילויות לפי **source_url** במקום source_id:

**קובץ:** `supabase/functions/_shared/property-helpers.ts`
**שורות 155-187:**

```typescript
// לפני - בודק source,source_id
onConflict: 'source,source_id',

// אחרי - בודק source_url (ייחודי יותר)
// אפשרות א': שימוש ב-source_url כ-unique constraint
onConflict: 'source_url',

// אפשרות ב': בדיקה ידנית לפני insert
const { data: existing } = await supabase
  .from('scouted_properties')
  .select('id')
  .eq('source_url', property.source_url)
  .single();

if (existing) {
  // Update existing instead of insert
  ...
}
```

---

### שינויים נדרשים

| קובץ | שינוי |
|------|-------|
| `supabase/migrations/xxx.sql` | SQL לניקוי כפילויות קיימות |
| `parser-madlan.ts` שורה 495 | הסרת prefix `madlan_` מ-source_id |
| `parser-homeless.ts` | בדיקה והסרת prefix אם קיים |
| `property-helpers.ts` שורות 155-187 | שינוי upsert ל-source_url או בדיקה ידנית |

---

### תוצאות צפויות

| מצב | לפני | אחרי |
|-----|------|------|
| כפילויות | 285 זוגות | 0 |
| התאמות לזיו | 90 (כולל 6 כפולות) | ~87 (ללא כפילויות) |
| is_private שונה לאותו נכס | כן | לא - נשמרת הרשומה החדשה |

---

### הערות חשובות

1. **שמירת מידע**: לפני מחיקת כפילויות, צריך לוודא שהרשומה הנשארת מכילה את המידע המלא יותר (features, is_private וכו')
2. **Unique constraint**: ייתכן שנצטרך להוסיף UNIQUE constraint על source_url בדאטבייס
3. **Backfill**: אחרי הניקוי, צריך להפעיל matching מחדש לכל הלקוחות

