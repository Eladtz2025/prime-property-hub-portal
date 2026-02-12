
# תיקון: זיהוי ₪ הנכון + Boolean error

## בעיה 1: תגית ירידת מחיר תופסת את ה-₪ הלא נכון

במודעות עם "ירד ב-250,000 ₪", ה-₪ הראשון הוא בתגית ירידת המחיר (אחרי המספר), לא בשורת המחיר (לפני המספר).

הקוד הנוכחי: `block.indexOf('₪')` -- מוצא את ה-₪ הראשון שהוא בתגית

**תיקון**: במקום `indexOf('₪')`, צריך למצוא את ה-₪ שלפניו אין מספר (כלומר זה ₪ שמתחיל שורת מחיר, לא ₪ שמסיים תגית "ירד ב-XXX ₪"). או יותר פשוט: למצוא את הדפוס `₪\s*[\d,]` (₪ ואז מספר) ולהשתמש במיקום שלו.

### קובץ: `supabase/functions/_experimental/parser-yad2.ts`

שינוי שורות 241-242:

**לפני:**
```typescript
const imgEndMatch = block.match(/\]\([^)]+\)/);
const shekelIndex = block.indexOf('₪');
```

**אחרי:**
```typescript
const imgEndMatch = block.match(/\]\([^)]+\)/);
// Find the ACTUAL price ₪ (₪ followed by number), not price-drop tags (number followed by ₪)
const priceLineMatch = block.match(/₪\s*[\d,]/);
const shekelIndex = priceLineMatch ? block.indexOf(priceLineMatch[0]) : -1;
```

בנוסף, הוספת ניקוי markdown images מתוך `textBetween` (שורות 247-251) כדי שתגיות כמו `![alt](url)` לא ייתפסו כשמות סוכנות:

```typescript
const textBetween = block.substring(imgEndPos, shekelIndex)
  .replace(/[\u200F\u200E\u200B‎‏]/g, '')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')  // Strip markdown images
  .replace(/\\/g, '')
  .replace(/\n/g, ' ')
  .trim();
```

## בעיה 2: Boolean error - "תל אביב יפו" נכנס ל-is_private

השגיאה `invalid input syntax for type boolean: "תל אביב יפו"` מופיעה בכל ה-upserts של המודעות הפרטיות. הפרסר מחזיר `is_private: true/false/null` -- לא string. צריך הגנה ב-`saveProperty`.

### קובץ: `supabase/functions/_shared/property-helpers.ts`

הוספת sanitization לפני ה-upsert (שורה 432):

```typescript
// Ensure is_private is strictly boolean or null (defensive check)
const safeIsPrivate = property.is_private === true ? true 
  : property.is_private === false ? false 
  : null;
```

ואז בשני מקומות שמשתמשים ב-`is_private`:
- שורה 341: `is_private: safeIsPrivate,` (update path)
- שורה 432: `is_private: safeIsPrivate,` (upsert path)

## סיכום

| בעיה | תיקון |
|------|-------|
| "ירד ב-250,000 ₪" תופס ₪ ראשון | חיפוש `₪` שאחריו מספר (המחיר האמיתי) |
| תגיות תמונה markdown נתפסות כסוכנות | strip `![...](...)` מ-textBetween |
| "תל אביב יפו" ב-is_private boolean | defensive sanitization ב-saveProperty |
