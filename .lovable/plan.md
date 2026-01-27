
# תיקון פרסר Homeless - מיקוד בתל אביב + שכונות

## מה למדתי מהפרסרים של Yad2 ו-Madlan

### 1. מילון שכונות מובנה (parser-madlan.ts שורות 209-230)
Madlan משתמש ב-`KNOWN_NEIGHBORHOODS` עם רשימה מפורשת:
```typescript
const KNOWN_NEIGHBORHOODS = [
  { pattern: /צפון\s*(?:ה)?ישן/, value: 'צפון_ישן', label: 'צפון ישן' },
  { pattern: /פלורנטין/i, value: 'פלורנטין', label: 'פלורנטין' },
  { pattern: /נווה\s*צדק/i, value: 'נווה_צדק', label: 'נווה צדק' },
  // ... 20+ שכונות
];
```

### 2. חיפוש בכל הבלוק (parser-madlan.ts שורות 299-304)
```typescript
// First: Try to extract neighborhood from the ENTIRE block (most reliable)
const blockNeighborhood = extractNeighborhoodFromBlock(block);
```

### 3. ברירת מחדל לעיר (parser-madlan.ts שורה 297)
```typescript
const city = 'תל אביב יפו'; // ברירת מחדל כי סורקים רק תל אביב
```

## מה חסר ב-Homeless

### בעיה 1: אין ברירת מחדל לעיר
הפרסר מנסה לחלץ עיר מעמודה 3, אבל אם זה לא עובד - מקבלים `null`.

### בעיה 2: שכונות לא מזוהות
`extractNeighborhood` מוגדר ב-parser-utils.ts ויש שם רשימה טובה, אבל:
- הקוד מחפש רק ב-`neighborhoodText` (עמודה 4)
- לא מחפש בטקסט המלא של השורה
- אם `city` הוא null, הפונקציה לא יודעת באיזו רשימת שכונות לחפש

### בעיה 3: אין סינון לפי עיר
Homeless כולל נכסים מכל הארץ, אבל אתה רוצה רק תל אביב.

## הפתרון המוצע

### שינוי 1: ברירת מחדל "תל אביב יפו" (כמו Madlan)
```typescript
// Homeless parser - since we're scanning Tel Aviv, default to it
const DEFAULT_CITY = 'תל אביב יפו';

// Use extracted city or default
const city = extractCity(cityText) || cityText || DEFAULT_CITY;
```

### שינוי 2: חיפוש שכונות בטקסט המלא
במקום רק בעמודה 4, נחפש גם ב-`fullRowText`:
```typescript
// Try neighborhood from column 4 first
let neighborhood = extractNeighborhood(neighborhoodText, city);

// Fallback: search in full row text
if (!neighborhood) {
  neighborhood = extractNeighborhood(fullRowText, city);
}
```

### שינוי 3: סינון נכסים שלא מתל אביב
בסוף הפרסר, נסנן נכסים שהעיר שלהם לא תל אביב:
```typescript
// Filter to Tel Aviv only (optional - can be config-based)
const filteredProperties = properties.filter(p => 
  p.city === 'תל אביב יפו' || 
  p.city === 'תל אביב' ||
  !p.city // Keep unknown cities for now
);
```

### שינוי 4: הרחבת רשימת השכונות (parser-utils.ts)
להוסיף שכונות שחסרות:
```typescript
// הוספה ל-TEL_AVIV_NEIGHBORHOODS
{ pattern: /רמת\s*אביב\s*(?:ה)?חדשה/i, value: 'רמת_אביב_החדשה', label: 'רמת אביב החדשה' },
{ pattern: /אפקה/i, value: 'אפקה', label: 'אפקה' },
{ pattern: /קרית\s*שלום/i, value: 'קרית_שלום', label: 'קרית שלום' },
{ pattern: /שכונת\s*התקווה/i, value: 'התקווה', label: 'שכונת התקווה' },
```

## קבצים לעדכון

1. **`_experimental/parser-homeless.ts`**
   - הוספת `DEFAULT_CITY = 'תל אביב יפו'`
   - חיפוש שכונות ב-fullRowText
   - סינון אופציונלי לתל אביב בלבד

2. **`_experimental/parser-utils.ts`**
   - הרחבת `TEL_AVIV_NEIGHBORHOODS`

3. **`_personal-scout/parser-homeless.ts`**
   - סנכרון אותם שינויים

4. **`_personal-scout/parser-utils.ts`**
   - סנכרון שכונות

## תוצאה צפויה

| שדה | לפני | אחרי (צפי) |
|-----|------|------------|
| עיר | ~50% | 100% (ברירת מחדל) |
| שכונות | ~10% | 60%+ |
| מחיר | 80%+ | 80%+ (כבר תוקן) |
| חדרים | 100% | 100% |
| קומה | 100% | 100% |
| גודל | 0% | 0% (לא קיים בטבלה) |

## הערה על גודל

גודל **לא זמין** בטבלת תוצאות Homeless. הוא מופיע רק בדפי הפרטים של הנכסים.
כדי לקבל גודל היינו צריכים לגרד כל דף נכס בנפרד - זה אפשרי אבל מגדיל משמעותית את כמות הקריאות והעלות.
