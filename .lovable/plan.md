

# תיקון איכות נתונים בפרסר Homeless ובפונקציית Backfill

## בעיות שזוהו

### בעיה 1: גודל שגוי (152 מ"ר במקום 70 מ"ר)
הפונקציה `backfill-property-data` מחלצת את הגודל מדפי מודעות בודדים, אבל הרגקס לוקח את המספר **הראשון** לפני "מ"ר" - שמגיע מ**מודעות דומות** בתחתית הדף במקום מהמודעה עצמה.

**דוגמה:**
- במודעה עצמה: `מ"ר: 70`
- במודעות דומות למטה: `152 מ"ר`
- הרגקס לוקח 152 (ראשון) במקום 70

### בעיה 2: כותרות חסרות שם רחוב
הפרסר `parser-homeless.ts` בונה title מ: `סוג נכס + חדרים + שכונה`

**דוגמה:**
- **כתובת שנשמרת:** `ארלוזורוב, הצפון הישן, תל אביב - יפו`
- **כותרת שנוצרת:** `דירה 2.5 חדרים בצפון ישן` (חסר "ארלוזורוב")
- **מה שצריך:** `דירה 2.5 חדרים בארלוזורוב, צפון ישן`

---

## שינויים נדרשים

### שלב 1: תיקון חילוץ גודל ב-backfill-property-data

**קובץ:** `supabase/functions/backfill-property-data/index.ts`

**שינוי:** נשפר את לוגיקת החילוץ כך שתחפש גודל רק באזור התוכן הראשי של המודעה (לפני "מודעות דומות"):

```typescript
// Before extracting, clean the markdown to remove "related ads" sections
const mainContent = markdown.split(/עוד מודעות|מודעות דומות|עוד חיפושים/i)[0] || markdown;

// Extract size from main content only
const sizePatterns = [
  /מ"ר[:\s]*(\d+)/,           // Look for מ"ר: 70 format first
  /שטח[:\s]*(\d+)/,
  /(\d+)\s*מ"ר(?!\s*•)/,      // Avoid bullet format from related ads
  /(\d+)\s*מטר/,
];
```

### שלב 2: תיקון בניית כותרת ב-parser-homeless.ts

**קובץ:** `supabase/functions/_experimental/parser-homeless.ts`

**שינוי בפונקציה `buildTitle`:** נוסיף את שם הרחוב לכותרת

```typescript
function buildTitle(
  propertyType: string,
  rooms: string,
  location: string,
  street: string | null   // New parameter
): string {
  const parts: string[] = [];
  
  if (propertyType) {
    parts.push(propertyType);
  }
  
  if (rooms) {
    parts.push(`${rooms} חדרים`);
  }
  
  // Include street in location
  if (street && location) {
    parts.push(`ב${street}, ${location}`);
  } else if (street) {
    parts.push(`ב${street}`);
  } else if (location) {
    parts.push(`ב${location}`);
  }
  
  return parts.join(' ') || 'נכס להשכרה';
}
```

**קריאה מעודכנת (שורה 274):**
```typescript
const title = buildTitle(
  propertyTypeText, 
  roomsLabel, 
  neighborhood?.label || neighborhoodText || cityText || '',
  streetText  // Add street parameter
);
```

### שלב 3: ניקוי נתונים קיימים

**מיגרציית SQL:** נקה גדלים שגויים ועדכן כותרות

```sql
-- Step 1: Clear incorrect sizes from homeless properties
-- (they were extracted from "related ads" section)
UPDATE scouted_properties 
SET size = NULL
WHERE source = 'homeless' 
AND size IS NOT NULL;

-- Step 2: Update titles to include street names where available
UPDATE scouted_properties
SET title = CONCAT(
  CASE 
    WHEN title LIKE 'דירה%' THEN 'דירה'
    WHEN title LIKE 'דירת גג%' THEN 'דירת גג'
    WHEN title LIKE 'פנטהאוז%' THEN 'פנטהאוז'
    WHEN title LIKE 'סטודיו%' THEN 'סטודיו'
    ELSE 'דירה'
  END,
  ' ',
  COALESCE(rooms::text, ''),
  CASE WHEN rooms IS NOT NULL THEN ' חדרים ב' ELSE ' ב' END,
  SPLIT_PART(address, ',', 1),  -- Street name
  ', ',
  COALESCE(neighborhood, '')
)
WHERE source = 'homeless'
AND address IS NOT NULL
AND address LIKE '%, %';
```

---

## סדר ביצוע

1. **תיקון הקוד** - עדכון שני הקבצים (backfill + parser)
2. **ניקוי נתונים** - מחיקת גדלים שגויים ועדכון כותרות
3. **פריסת Edge Functions** - deploy של הפונקציות המעודכנות
4. **בדיקה** - הרצת סריקת homeless חדשה ואימות איכות הנתונים

---

## השפעה

| נתון | לפני | אחרי |
|------|------|------|
| נכסים עם גודל שגוי | 370 | 0 |
| כותרות ללא רחוב | 354 | 0 |

