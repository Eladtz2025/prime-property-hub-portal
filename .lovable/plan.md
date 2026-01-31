
# ניקוי כפילויות מאותו מקור ותיקון מניעתי

## סיכום הבעיה

מצאתי **1,577 רשומות כפולות** שצריכות להימחק:

| מקור | כפילויות למחיקה | קבוצות בעייתיות |
|------|-----------------|------------------|
| Yad2 | 882 | 820 |
| Homeless | 591 | 280 |
| Madlan | 104 | 91 |

### דוגמה לבעיה:
אותה דירה באוסישקין (URL: `viewad,83208.aspx`) מופיעה **8 פעמים** עם source_id שונה:
- `homeless-oqownc`, `homeless-oqownd`, `homeless-oqownk`, וכו'

## שורש הבעיה

### 1. חילוץ ID שגוי מ-URL
פונקציית `generateSourceId` מחפשת `/(\d+)(?:\/|$|\?)` - אבל:
- Homeless משתמש בפסיק: `viewad,83208.aspx` (לא נלכד!)
- Madlan לפעמים משתמש בפורמטים שונים

כשה-regex נכשל, הפונקציה יוצרת hash אקראי עם ה-index, וכל ריצה מייצרת ID שונה!

### 2. ה-upsert לא עוזר
למרות ש-upsert מוגדר על `source + source_id`, כל רשומה מקבלת source_id ייחודי אז הכפילויות נכנסות.

## הפתרון - 3 שלבים

### שלב 1: ניקוי מיידי - מחיקת כפילויות מ-DB

SQL Script שמשאיר רק את הרשומה **הראשונה** מכל קבוצת כפילויות:

```sql
-- Delete duplicate records from same source, keeping only the oldest one
WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY source, address, rooms, price, floor 
        ORDER BY created_at ASC
      ) as row_num
    FROM scouted_properties
    WHERE is_active = true
    AND address IS NOT NULL
    AND rooms IS NOT NULL
    AND price IS NOT NULL
  ) ranked
  WHERE row_num > 1
)
DELETE FROM scouted_properties 
WHERE id IN (SELECT id FROM duplicates_to_delete);
```

### שלב 2: תיקון חילוץ ID - עדכון `generateSourceId`

```typescript
export function generateSourceId(source: string, url: string, index: number): string {
  if (!url) {
    return `${source}-idx-${index}`;
  }
  
  // HOMELESS: viewad,12345.aspx OR viewad,12345 OR /viewad,12345
  const homelessMatch = url.match(/viewad[,\/](\d+)/i);
  if (homelessMatch) {
    return `${source}-${homelessMatch[1]}`;
  }
  
  // MADLAN: /listing/ABC123 or listing ID in path
  const madlanMatch = url.match(/\/listing\/([a-zA-Z0-9]+)/i) || 
                      url.match(/\/([a-zA-Z0-9]{10,})/);
  if (madlanMatch) {
    return `${source}-${madlanMatch[1]}`;
  }
  
  // YAD2: /item/12345678 or /ad/12345678
  const yad2Match = url.match(/(?:item|ad)\/(\d+)/i);
  if (yad2Match) {
    return `${source}-${yad2Match[1]}`;
  }
  
  // GENERIC: Any numeric ID in URL
  const genericMatch = url.match(/\/(\d{5,})/);
  if (genericMatch) {
    return `${source}-${genericMatch[1]}`;
  }
  
  // Last resort: Hash the FULL URL (without index!)
  const hash = simpleHash(url);
  return `${source}-url-${hash}`;
}
```

### שלב 3: הוספת בדיקת כפילות לפני שמירה

ב-`parser-homeless.ts` וב-scouts - בדיקה מוקדמת לפני push:

```typescript
// Before adding property to array, check for existing source_url
const existingIndex = properties.findIndex(p => 
  p.source_url === property.source_url && 
  p.source === property.source
);

if (existingIndex === -1) {
  properties.push(property);
} else {
  console.log(`[Parser] Skipping duplicate URL: ${property.source_url}`);
}
```

## סיכום השינויים

| קובץ | פעולה |
|------|-------|
| **SQL Migration** | מחיקת 1,577 כפילויות מ-DB |
| `parser-utils.ts` | תיקון `generateSourceId` לתמיכה ב-Homeless/Madlan/Yad2 |
| `parser-homeless.ts` | הוספת בדיקת כפילות URL לפני push |
| `property-helpers.ts` | (אופציונלי) הוספת בדיקת source_url כ-fallback |

## תוצאה צפויה

- **מיידית**: מחיקת ~1,577 רשומות כפולות
- **מניעה**: כל נכס יקבל source_id קבוע מבוסס URL
- **אמינות**: לא יכנסו יותר כפילויות מאותו מקור
