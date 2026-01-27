

# שיפור הפרסר של Homeless - שימוש בטבלת הרחובות

## מה גיליתי

### 1. יש טבלת `street_neighborhoods` עם 933 רחובות
מיפוי רחוב → שכונה עם confidence score, אבל **הפרסר לא משתמש בזה**!

### 2. מהתמונה - הפרטים שזמינים בדף נכס
| שדה | זמין בחיפוש | זמין בדף פרטים |
|-----|-------------|----------------|
| מחיר | ✓ | ✓ |
| חדרים | ✓ | ✓ |
| קומה | ✓ | ✓ (+ מתוך כמה) |
| **גודל** | ✗ | ✓ (40 מ"ר) |
| שכונה | ✓ | ✓ |
| רחוב | ✓ | ✓ |
| מרפסת | ✗ | ✓ |
| חניה | ✗ | ✓ |
| מעלית | ✗ | ✓ |
| מחסן | ✗ | ✓ |
| מזגן | ✗ | ✓ |

## הפתרון

### שלב 1: שימוש ב-street_neighborhoods לזיהוי שכונות
כשיש שם רחוב (עמודה 5) אבל אין שכונה מזוהה, נחפש בטבלה:

```typescript
import { lookupNeighborhoodByStreet, createSupabaseClient } from './street-lookup.ts';

// After extracting streetText from column 5
if (!neighborhood && streetText && city === 'תל אביב יפו') {
  const supabase = createSupabaseClient();
  const streetLookup = await lookupNeighborhoodByStreet(supabase, streetText, city);
  if (streetLookup) {
    neighborhood = {
      label: streetLookup.neighborhood,
      value: streetLookup.neighborhood_value
    };
  }
}
```

### שלב 2: הפיכת הפרסר ל-async
כדי להשתמש ב-database lookup, הפונקציה צריכה להיות async:

```typescript
export async function parseHomelessHtml(
  html: string,
  propertyType: 'rent' | 'sale',
  supabase?: SupabaseClient  // Optional - pass from caller
): Promise<ParserResult>
```

### שלב 3: סדר עדיפות לזיהוי שכונה

1. **עמודה 4 (neighborhoodText)** - מידע ישיר מ-Homeless
2. **חיפוש רחוב בטבלה (streetText)** - 933 רחובות ממופים
3. **עמודה 5 (streetText) regex** - חיפוש patterns בשם הרחוב
4. **fullRowText** - חיפוש בכל הטקסט

## הערה על גודל ופרטים נוספים

הגודל (40 מ"ר) ופרטים כמו מרפסת/חניה/מזגן **זמינים רק בדף הפרטים** של הנכס, לא בתוצאות החיפוש.

כדי לקבל אותם היינו צריכים לגרד כל דף נכס בנפרד - זה אפשרי אבל:
- מגדיל את כמות הקריאות פי 50-100
- מגדיל את העלות משמעותית
- מאט את הסקאן

**המלצה:** להתמקד קודם בשיפור זיהוי השכונות באמצעות טבלת הרחובות. אפשר להוסיף scraping של דפי פרטים בשלב מאוחר יותר.

## קבצים לעדכון

1. **`_experimental/parser-homeless.ts`**
   - המרה ל-async function
   - הוספת import ל-street-lookup
   - שימוש ב-lookupNeighborhoodByStreet כ-fallback

2. **`_experimental/scout-homeless.ts`** (אם קיים)
   - עדכון לקריאה ל-async parseHomelessHtml

3. **`_personal-scout/parser-homeless.ts`**
   - סנכרון אותם שינויים

## תוצאה צפויה

| שדה | לפני | אחרי (צפי) |
|-----|------|------------|
| שכונות | 89% | 95%+ |
| עיר | 100% | 100% |
| מחיר | 93% | 93% |
| רחוב | כבר נקלט | כבר נקלט |

## שלב עתידי (אופציונלי)

לקבלת גודל ופרטים נוספים - scraping של דפי פרטים:
- לכל נכס חדש, לגרד את `source_url`
- לחלץ גודל, מרפסת, חניה, מזגן וכו'
- זה יהיה פרויקט נפרד עם עלות נוספת

