
# תיקון חילוץ מחיר, עיר וגודל מ-Homeless

## הבעיות שמצאתי

### 1. מחיר - קולט מספרים שגויים
| ערך שנקלט | סוג הבעיה |
|-----------|----------|
| 32,425,100 | מספר טלפון |
| 62,133,100 | מספר טלפון או ID |
| 2,107,700 | תעודת זהות |

**הסיבה:** הפונקציה `extractPrice` מחפשת קודם בטקסט הכללי של השורה (`fullRowText`) ומוצאת מספרי טלפון או IDs לפני שמגיעה ל-fallback של עמודה 8.

### 2. עיר - לא נקלטת ב-50% מהמקרים
הרבה נכסים עם `city: null` למרות שיש עיר ב-`neighborhoodText`:
- "קרית מוצקין", "טבריה", "אילת", "חדרה"

**הסיבה:** הרשימה ב-`extractCity` מכילה רק ערים נפוצות (תל אביב, רמת גן וכו') אבל לא ערים כמו קרית מוצקין, טבריה, אילת.

### 3. גודל - 0% תמיד
**הסיבה:** מאושר - אין עמודת גודל בטבלה של Homeless. הגודל זמין רק בדף הפרטים של הנכס.

## הפתרון

### שינוי 1: תיקון לוגיקת המחיר (עדיפות ל-fallback)
**קובץ:** `_experimental/parser-homeless.ts`

**לפני:**
```typescript
let price = extractPrice(fullRowText);
// ...
if (!price && tds.length > 8) {
  const priceCell = cleanText($(tds[8]).text());
  // fallback
}
```

**אחרי:**
```typescript
// Price: extract from column FIRST, then fallback to text
let price: number | null = null;

// Primary: Get from price column (td[8]) - more reliable
if (tds.length > 8) {
  const priceCell = cleanText($(tds[8]).text());
  const cleaned = priceCell.replace(/[^\d]/g, '');
  if (cleaned) {
    const num = parseInt(cleaned, 10);
    // Rent: 500-50,000 | Sale: 100,000-50,000,000
    if ((propertyType === 'rent' && num >= 500 && num <= 50000) ||
        (propertyType === 'sale' && num >= 100000 && num <= 50000000)) {
      price = num;
    }
  }
}

// Fallback: Extract from full text only if column failed
if (!price) {
  price = extractPrice(fullRowText);
}
```

### שינוי 2: הרחבת רשימת הערים ב-parser-utils.ts
**קובץ:** `_experimental/parser-utils.ts`

```typescript
const CITY_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  // ערים קיימות...
  
  // ערים נוספות (נפוצות ב-Homeless)
  { pattern: /קרית\s*מוצקין/i, canonical: 'קרית מוצקין' },
  { pattern: /קרית\s*ביאליק/i, canonical: 'קרית ביאליק' },
  { pattern: /קרית\s*אתא/i, canonical: 'קרית אתא' },
  { pattern: /טבריה/i, canonical: 'טבריה' },
  { pattern: /אילת/i, canonical: 'אילת' },
  { pattern: /חדרה/i, canonical: 'חדרה' },
  { pattern: /קדימה|צורן/i, canonical: 'קדימה צורן' },
  { pattern: /דאלית\s*אל\s*כרמל/i, canonical: 'דאלית אל כרמל' },
  { pattern: /ירושלים/i, canonical: 'ירושלים' },
  { pattern: /חיפה/i, canonical: 'חיפה' },
  { pattern: /באר\s*שבע/i, canonical: 'באר שבע' },
  { pattern: /מודיעין/i, canonical: 'מודיעין' },
  { pattern: /נס\s*ציונה/i, canonical: 'נס ציונה' },
  { pattern: /יבנה/i, canonical: 'יבנה' },
  { pattern: /לוד/i, canonical: 'לוד' },
  { pattern: /רמלה/i, canonical: 'רמלה' },
  { pattern: /עפולה/i, canonical: 'עפולה' },
  { pattern: /נהריה/i, canonical: 'נהריה' },
  { pattern: /עכו/i, canonical: 'עכו' },
  { pattern: /קרית\s*ים/i, canonical: 'קרית ים' },
  { pattern: /נשר/i, canonical: 'נשר' },
  { pattern: /טירת\s*כרמל/i, canonical: 'טירת כרמל' },
];
```

### שינוי 3: חילוץ עיר מתא td[3]
**קובץ:** `_experimental/parser-homeless.ts`

```typescript
// City: extract directly from column td[3]
let directCity: string | null = null;
if (tds.length > 3) {
  const cityCell = cleanText($(tds[3]).text());
  directCity = extractCity(cityCell) || cityCell;
}

// Use direct city if available, otherwise fall back to pattern matching
const city = directCity || extractCity(fullRowText) || null;
```

### שינוי 4: הערה לגבי גודל
נוסיף הערה בקוד שמסבירה למה גודל תמיד null ב-Homeless:

```typescript
// NOTE: Size is NOT available in Homeless search results.
// It only appears in individual property detail pages.
// To get size, we would need a second scrape of each property page.
const size: number | null = null;
```

## שלבי ביצוע

1. **עדכון parser-utils.ts** - הוספת ערים נוספות
2. **עדכון parser-homeless.ts** - תיקון לוגיקת מחיר ועיר
3. **סנכרון לקובץ personal-scout** - אותם שינויים
4. **Deploy** - העלאת scout-homeless ו-personal-scout-worker
5. **ריצת בדיקה** - סקאן Homeless לוודא שהשיפור עובד

## תוצאה צפויה

| שדה | לפני | אחרי (צפי) |
|-----|------|------------|
| חדרים | 100% ✅ | 100% |
| קומה | 100% ✅ | 100% |
| מחיר | ~50% (עם שגיאות) | 80%+ (נכון) |
| עיר | ~50% | 80%+ |
| גודל | 0% | 0% (לא קיים בטבלה) |

## הערה לגבי גודל

הגודל **לא זמין** בתוצאות החיפוש של Homeless - הוא מופיע רק בדף הפרטים של כל נכס. כדי לקבל אותו היינו צריכים לגרד כל דף נכס בנפרד, מה שיגדיל משמעותית את כמות הקריאות והעלות. זה אפשרי אבל דורש שינוי משמעותי בארכיטקטורה.
