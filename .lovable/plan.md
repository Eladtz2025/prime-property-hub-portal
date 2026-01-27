

# תיקון חילוץ נתונים מ-Homeless - אבחנה מעודכנת

## מה גילינו

**גם אתמול ב-8 בערב הנתונים לא נשמרו נכון!**

| תאריך | סה"כ | עם מחיר | עם חדרים |
|-------|------|---------|----------|
| 27.01 | 344 | 90 | **0** |
| 26.01 | 1207 | 1037 | **0** |
| 25.01 | 832 | 733 | **0** |
| 24.01 | 1 | 1 | 1 ✅ |
| 23.01 | 18 | 18 | 18 ✅ |

**מה-25.01 ואילך - אפס חדרים!** הנכסים מה-20-24 עברו דרך מנגנון אחר (AI) שעבד.

### הסיבה הטכנית

הפונקציה `extractRooms` ב-`parser-utils.ts` דורשת סיומת:

```typescript
// מחפש: "3 חדרים" או "3 חד'"
const match = text.match(/(\d+(?:[.,]\d)?)\s*(?:חד[׳']|חדרים)/);
```

אבל בטבלה של Homeless יש רק **מספר בלבד** ("3") בתא נפרד - בלי הסיומת!

## הפתרון

להוסיף **fallback לחילוץ ישיר מתאי הטבלה** כשהחילוץ הרגיל נכשל.

### שינויים בקובץ: `_experimental/parser-homeless.ts`

**לפני (שורות 64-67):**
```typescript
const price = extractPrice(fullRowText);
const rooms = extractRooms(fullRowText);
const floor = extractFloor(fullRowText);
const size = extractSize(fullRowText);
```

**אחרי:**
```typescript
// נסה קודם את הפונקציות הרגילות (עובדות כשיש סיומות)
let price = extractPrice(fullRowText);
let rooms = extractRooms(fullRowText);
let floor = extractFloor(fullRowText);
let size = extractSize(fullRowText);

// ========== FALLBACK: חילוץ ישיר מעמודות ==========
// מיפוי עמודות של Homeless:
// [0-1]=סוג+שכונה, [2]=עיר, [3]=חדרים, [4]=קומה, [5]=גודל, [6-7]=מחיר

// חדרים (עמודה 3) - מספר בלבד, 1-20
if (!rooms && tds.length > 3) {
  const roomsCell = cleanText($(tds[3]).text());
  const roomsMatch = roomsCell.match(/^(\d+(?:[.,]\d)?)$/);
  if (roomsMatch) {
    const num = parseFloat(roomsMatch[1].replace(',', '.'));
    if (num >= 1 && num <= 20) rooms = num;
  }
}

// קומה (עמודה 4) - מספר שלם, -5 עד 100
if (!floor && tds.length > 4) {
  const floorCell = cleanText($(tds[4]).text());
  const floorMatch = floorCell.match(/^(-?\d+)$/);
  if (floorMatch) {
    const num = parseInt(floorMatch[1], 10);
    if (num >= -5 && num <= 100) floor = num;
  }
}

// גודל (עמודה 5) - מספר שלם, 10-2000
if (!size && tds.length > 5) {
  const sizeCell = cleanText($(tds[5]).text());
  const sizeMatch = sizeCell.match(/^(\d+)$/);
  if (sizeMatch) {
    const num = parseInt(sizeMatch[1], 10);
    if (num >= 10 && num <= 2000) size = num;
  }
}

// מחיר (עמודות 6-7) - מספר עם פסיקים
if (!price && tds.length > 6) {
  const priceCell = cleanText($(tds[6]).text() + $(tds[7]).text());
  const cleaned = priceCell.replace(/[^\d]/g, '');
  if (cleaned) {
    const num = parseInt(cleaned, 10);
    if (num >= 500 && num <= 100000000) price = num;
  }
}
```

## שלבי ביצוע

1. **עדכון הפרסר** - הוספת לוגיקת fallback
2. **Deploy** - העלאת scout-homeless
3. **ריצת בדיקה** - סקאן Homeless לוודא שהשדות נקלטים
4. **בדיקת תוצאות** - וידוא שחדרים/גודל/קומה מתמלאים

## תוצאה צפויה

| שדה | לפני | אחרי (צפי) |
|-----|------|------------|
| חדרים | 0% | 70%+ |
| גודל | 0% | 70%+ |
| קומה | 8% | 50%+ |
| מחיר | 26% | 50%+ |

## הערה לגבי "נעילה"

אחרי שהתיקון יעבוד, אוסיף הערה בראש הפרסר שמציינת שזה קוד פרודקשן יציב ואסור לשנות בלי לבדוק.

