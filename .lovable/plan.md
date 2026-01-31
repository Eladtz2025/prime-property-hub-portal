
# תיקון באגים בפרסר Homeless

## סיכום הבעיות שזוהו

### בעיה 1: שכונת "יפו" שגויה (CRITICAL)
**הבעיה:** דירות ברחובות מרכזיים כמו דיזנגוף, ארלוזורוב, אבן גבירול מסומנות בטעות כ"יפו"

**הסיבה:** כשאין שכונה בעמודת `neighborhoodText`, הפרסר מחפש ב-`fullRowText` ומוצא "יפו" בתוך המילה "תל אביב **יפו**"

**דוגמאות:**
- `דיזנגוף, תל אביב יפו` → neighborhood: "יפו" (שגוי! צריך להיות צפון ישן)
- `ארלוזורוב, תל אביב יפו` → neighborhood: "יפו" (שגוי! צריך להיות לב העיר)
- `אבן גבירול, תל אביב יפו` → neighborhood: "יפו" (שגוי! צריך להיות מרכז העיר)

**פתרון:** לא להשתמש ב-`extractNeighborhood(fullRowText)` כ-fallback - רק בעמודות ספציפיות

---

### בעיה 2: קו תחתון בשכונות
**הבעיה:** שכונות מוצגות עם קו תחתון במקום רווחים

**דוגמאות:**
- `מרכז_העיר` במקום "מרכז העיר"

**הסיבה:** הפרסר מחזיר `neighborhood.value` (מיועד לקוד) במקום `neighborhood.label` (מיועד לתצוגה)

**מיקום הבאג:** שורה 340 ב-`parser-homeless.ts`:
```typescript
neighborhood: neighborhood?.label || neighborhoodText || null,
```
אבל יש מקום נוסף שמשתמש ב-value - צריך לבדוק את `buildTitle()`

---

### בעיה 3: שכונות לא מזוהות (חסרות במילון)
**שכונות שקיימות ב-Homeless אבל לא במילון:**
| שכונה מקורית | כמות | פעולה |
|--------------|------|-------|
| `אזור ככר המדינה` | 2 | להוסיף alias ל-`כיכר_המדינה` |
| `ביצרון` | 1 | להוסיף שכונה חדשה |
| `ליבנה` | 2 | להוסיף שכונה חדשה |
| `כוכב הצפון` | 1 | להוסיף alias ל-`צפון_חדש` |
| `גבול פלורנטין` | 1 | להוסיף alias ל-`פלורנטין` |
| `מרכז` | 5 | להוסיף alias ל-`מרכז_העיר` |
| `גני שרונה` | 1 | להוסיף alias ל-`רוטשילד` |
| `לב תל אביב` | 1 | כבר קיים (יש ⁰ בסוף - ניקוי טקסט) |
| `נאות אפקה א'` | 1 | להוסיף alias ל-`אפקה` |
| `הצמפון הישן` | 1 | שגיאת הקלדה, להוסיף pattern |

---

### בעיה 4: קומות לא הגיוניות
**דוגמאות:**
- floor: 42 (עם neighborhoodText: מונטיפיורי)
- floor: 40 (עם street: דרך מנחם בגין)

**הערה:** אלו לגיטימיים! מגדל שרונה ומגדלי ToHa מגיעים לקומות גבוהות

---

## תוכנית תיקון

### שלב 1: תיקון בעיית "יפו" השגויה
**קובץ:** `parser-homeless.ts` (שורות 241-247)

**לפני:**
```typescript
let neighborhood = extractNeighborhood(neighborhoodText, city);
if (!neighborhood) {
  neighborhood = extractNeighborhood(streetText, city);
}
if (!neighborhood) {
  neighborhood = extractNeighborhood(fullRowText, city); // הבעיה!
}
```

**אחרי:**
```typescript
let neighborhood = extractNeighborhood(neighborhoodText, city);
if (!neighborhood) {
  neighborhood = extractNeighborhood(streetText, city);
}
// REMOVED: extractNeighborhood(fullRowText) - causes false "יפו" matches
// from "תל אביב יפו" city suffix
```

---

### שלב 2: תיקון Regex של יפו ב-parser-utils.ts
**קובץ:** `parser-utils.ts` (שורה 238)

**לפני:**
```typescript
{ pattern: /עג'?מי|ajami|יפו\s*(?:ה)?עתיקה|יפו\s*(?:ד'?|ג'?|ב'?|א'?)|גבעת\s*(?:ה)?תמרים/i, value: 'יפו', label: 'יפו' },
```

**אחרי:**
```typescript
// יפו - only match explicit Jaffa neighborhoods, NOT "תל אביב יפו"
// Explicit sub-neighborhoods: יפו א/ב/ג/ד, יפו העתיקה, עג'מי, גבעת התמרים
{ pattern: /עג'?מי|ajami|יפו\s*העתיקה|יפו\s*[א-ד]'?(?:\s*-)?(?:\s*גבעת)?|גבעת\s*(?:ה)?תמרים/i, value: 'יפו', label: 'יפו' },
```

---

### שלב 3: הוספת שכונות חסרות
**קובץ:** `parser-utils.ts` - מערך `TEL_AVIV_NEIGHBORHOODS`

**להוסיף:**
```typescript
// Existing patterns to expand:
{ pattern: /כיכר\s*(?:ה)?מדינה|אזור\s*כיכר\s*המדינה|אזור\s*ככר\s*המדינה/i, value: 'כיכר_המדינה', label: 'כיכר המדינה' },
{ pattern: /מרכז\s*(?:ה)?עיר|לב\s*(?:ה)?עיר|לב\s*תל\s*אביב|^מרכז$/i, value: 'מרכז_העיר', label: 'מרכז העיר' },
{ pattern: /רוטשילד|שרונה|מונטיפיורי|גני\s*שרונה/i, value: 'רוטשילד', label: 'רוטשילד' },
{ pattern: /פלורנטין|גבול\s*פלורנטין/i, value: 'פלורנטין', label: 'פלורנטין' },

// New neighborhoods:
{ pattern: /ביצרון/i, value: 'ביצרון', label: 'ביצרון' },
{ pattern: /ליבנה/i, value: 'ליבנה', label: 'ליבנה' },
{ pattern: /כוכב\s*(?:ה)?צפון/i, value: 'כוכב_הצפון', label: 'כוכב הצפון' },
{ pattern: /הצמפון\s*הישן/i, value: 'צפון_ישן', label: 'צפון ישן' }, // Typo correction
{ pattern: /נאות\s*אפקה/i, value: 'אפקה', label: 'אפקה' },
```

---

### שלב 4: תיקון Title שמציג value במקום label
**קובץ:** `parser-homeless.ts` (שורה 276)

**לפני:**
```typescript
const title = buildTitle(propertyTypeText, roomsLabel, neighborhood?.label || neighborhoodText || cityText || '', streetText || null);
```

הבעיה: כש-`neighborhoodText` ריק אבל `neighborhood` נמצא דרך DB lookup, ה-`neighborhood.label` נשלח נכון.
**אבל:** כשה-fallback הוא `neighborhoodText` שהוא ריק, נופלים ל-`cityText` שזה "תל אביב יפו" ואז ה-title מכיל את זה.

**צריך לוודא:** שה-title משתמש רק ב-label ולא ב-value

---

## קבצים לעדכון

| קובץ | שינויים |
|------|---------|
| `supabase/functions/_experimental/parser-homeless.ts` | הסרת fullRowText fallback + תיקון title logic |
| `supabase/functions/_experimental/parser-utils.ts` | תיקון regex יפו + הוספת 8 שכונות חדשות |

---

## פרטים טכניים

### תיקון parser-homeless.ts

**שורות 241-247 - הסרת fullRowText fallback:**
```typescript
// Extract neighborhood with city context - search in column sources only
let neighborhood = extractNeighborhood(neighborhoodText, city);
if (!neighborhood && streetText) {
  neighborhood = extractNeighborhood(streetText, city);
}
// DO NOT search fullRowText - it contains "תל אביב יפו" which triggers false "יפו" matches
```

### תיקון parser-utils.ts

**שורה 227 - הרחבת pattern מרכז העיר:**
```typescript
{ pattern: /מרכז\s*(?:ה)?עיר|לב\s*(?:ה)?עיר|לב\s*תל\s*אביב|^מרכז$|מרכז\s*תל[-\s]?אביב/i, value: 'מרכז_העיר', label: 'מרכז העיר' },
```

**שורה 232 - הרחבת pattern כיכר המדינה:**
```typescript
{ pattern: /כיכר\s*(?:ה)?מדינה|ככר\s*(?:ה)?מדינה|אזור\s*כיכר\s*המדינה|אזור\s*ככר\s*המדינה/i, value: 'כיכר_המדינה', label: 'כיכר המדינה' },
```

**שורה 238 - תיקון regex יפו:**
```typescript
// יפו - must have explicit sub-neighborhood suffix to avoid matching "תל אביב יפו"
{ pattern: /עג'?מי|ajami|יפו\s+העתיקה|יפו\s+[אבגד]'?|גבעת\s*(?:ה)?תמרים/i, value: 'יפו', label: 'יפו' },
```

**הוספת שכונות חדשות (אחרי שורה 261):**
```typescript
// Additional neighborhoods found in Homeless data
{ pattern: /ביצרון/i, value: 'ביצרון', label: 'ביצרון' },
{ pattern: /ליבנה/i, value: 'ליבנה', label: 'ליבנה' },
{ pattern: /כוכב\s*(?:ה)?צפון/i, value: 'כוכב_הצפון', label: 'כוכב הצפון' },
{ pattern: /נוה\s*(?:ה)?חן|נווה\s*חן/i, value: 'נווה_חן', label: 'נווה חן' },
{ pattern: /גבעת\s*עמל/i, value: 'גבעת_עמל', label: 'גבעת עמל' },
{ pattern: /נאות\s*אפקה|אפקה\s*[אב]'?/i, value: 'אפקה', label: 'אפקה' },
{ pattern: /הצמפון\s*הישן/i, value: 'צפון_ישן', label: 'צפון ישן' }, // Typo handling
```

---

## תוצאה צפויה

1. **תיקון יפו:** דירות בדיזנגוף/ארלוזורוב/אבן גבירול לא יסומנו יותר כ"יפו"
2. **תצוגה נקייה:** שכונות יוצגו עם רווחים ("מרכז העיר") ולא קו תחתון
3. **זיהוי משופר:** 8 שכונות נוספות יזוהו נכון
4. **titles נקיים:** לא יהיו יותר titles כמו "דירה 2.5 חדרים בדיזנגוף, יפו"
