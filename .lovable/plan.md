
# תיקון מערכתי: סינון URLs שבורים מרשימת הנכסים

## סיכום הבעיה

בלחיצה על נכסים מסוימים, המשתמש מגיע לדף 404 כי ה-`source_url` השמור במערכת אינו קישור ישיר לנכס אלא:
- דף פרויקט (Yad2/Madlan)
- דף חיפוש כללי (לא נכס ספציפי)

## אבחנת הבעיה - נתונים מ-DB

| קטגוריה | כמות | דוגמה |
|---------|------|-------|
| Yad2 פרויקט | 21 | `/yad1/project/28706f6e/apartment/...` |
| Yad2 דף חיפוש | 1 | `/forsale?topArea=2&area=1&city=5000` |
| Madlan פרויקט | 18 | `/projects/הזוהר_21_תל_אביב` |
| Madlan דף חיפוש | 5 | `/for-rent/תל-אביב-יפו-ישראל?page=6` |
| **סה"כ שבורים** | **45** | |

## הפתרון - 3 שלבים

### שלב 1: ניקוי מיידי - מחיקה/השבתה של URLs שבורים מ-DB

SQL Script שמסמן כ-`is_active = false` את כל ה-URLs הבעייתיים:

```sql
UPDATE scouted_properties
SET is_active = false,
    status = 'invalid_url'
WHERE is_active = true
AND (
  -- Yad2 broken patterns
  (source = 'yad2' AND (
    source_url LIKE '%/yad1/project/%'
    OR source_url LIKE '%/yad1/%'  
    OR source_url LIKE '%forsale?%'
    OR source_url LIKE '%forrent?%'
  ))
  -- Madlan broken patterns
  OR (source = 'madlan' AND (
    source_url LIKE '%/projects/%'
    OR source_url NOT LIKE '%/listings/%'
  ))
);
```

### שלב 2: תיקון הפארסרים - מניעת כניסה של URLs שבורים

**עדכון `parser-madlan.ts` (שורות 112, 117, 133, 142, 181):**
- הסרת `/projects/` מהרשימה המותרת
- הוספת וולידציה ל-URL רק מסוג `/listings/`

**עדכון `parser-yad2.ts` (שורה 149):**
- כבר יש skip ל-project URLs, אבל נחזק עם regex מחמיר יותר

**עדכון `property-helpers.ts`:**
- הוספת פונקציית ולידציה `isValidSourceUrl()` שבודקת לפני שמירה

### שלב 3: פילטר קבוע בשאילתה (רשת ביטחון)

בפונקציית ה-query ב-`ScoutedPropertiesTable.tsx`, הוספת סינון:

```typescript
// Filter out invalid URLs at query level (safety net)
const INVALID_URL_PATTERNS = [
  '/yad1/',
  '/projects/',
  'forsale?',
  'forrent?',
  '/for-rent/',
  '/for-sale/'
];

// Add to query filters
query = query.not('source_url', 'ilike', '%/yad1/%')
             .not('source_url', 'ilike', '%/projects/%')
             .not('source_url', 'ilike', '%forsale?%')
             .not('source_url', 'ilike', '%forrent?%');
```

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| **SQL Migration** | השבתת 45 URLs שבורים |
| `supabase/functions/_experimental/parser-madlan.ts` | הסרת `/projects/` מפטרנים מותרים |
| `supabase/functions/_experimental/parser-yad2.ts` | חיזוק סינון project URLs |
| `supabase/functions/_shared/property-helpers.ts` | הוספת וולידציית URL לפני שמירה |
| `src/components/scout/ScoutedPropertiesTable.tsx` | הוספת פילטר URL בשאילתה כרשת ביטחון |

## תוצאה צפויה

- **מיידית**: 45 נכסים עם URLs שבורים לא יוצגו יותר
- **מניעה**: הפארסרים לא יכניסו יותר URLs בעייתיים
- **רשת ביטחון**: גם אם נכנס URL בעייתי, הוא לא יוצג למשתמש
