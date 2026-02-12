

# פישוט: זיהוי תיווך/פרטי ביד2

## הכלל הפשוט

כמו שהראית בתמונה:
- **יש טקסט מעל המחיר** (שם סוכנות) = תיווך (`is_private: false`)
- **אין טקסט מעל המחיר** = פרטי (`is_private: true`)

זהו. בלי false positive patterns, בלי double-name detection, בלי סיבוכים.

## מה משתנה

### קובץ: `supabase/functions/_experimental/parser-yad2.ts`

**מחיקת כל הסיבוכים** (שורות 240-319) והחלפה בלוגיקה פשוטה:

```typescript
// Step 1: Structural detection - check text between image end and price
const imgEndMatch = block.match(/\]\([^)]+\)/);
const shekelIndex = block.indexOf('₪');

if (imgEndMatch && shekelIndex > 0) {
  const imgEndPos = block.indexOf(imgEndMatch[0]) + imgEndMatch[0].length;
  if (shekelIndex > imgEndPos) {
    const textBetween = block.substring(imgEndPos, shekelIndex)
      .replace(/[\u200F\u200E\u200B‎‏]/g, '')
      .replace(/\\/g, '')
      .replace(/\n/g, ' ')
      .trim();

    // Get alt text to exclude from comparison
    const altMatch = block.match(/\[!\[([^\]]*)\]/);
    const altText = altMatch ? altMatch[1].trim() : '';

    if (textBetween has meaningful text that isn't alt text) {
      // Text above price = broker
      isPrivate = false;
      detectedAgency = cleaned text;
    } else {
      // No text above price = private
      isPrivate = true;
    }
  }
}
```

**הסרת:**
- רשימת `FALSE_POSITIVE_PATTERNS` (שורות 240-250) -- לא צריך
- בדיקת double-name (שורות 281-296) -- לא צריך  
- Step 2 keyword fallback (שורות 302-305) -- לא צריך בשלב SERP
- Step 3 explicit private check (שורות 307-316) -- מיותר, הלוגיקה הפשוטה מכסה
- Step 4 comment (שורות 318-319) -- לא רלוונטי

**נשאר:**
- חילוץ טקסט בין תמונה ל-₪ (המנגנון הבסיסי)
- ניקוי RTL markers ו-backslashes
- השוואה ל-alt text (כדי לא לטעות בטקסט חוזר)

## לוגיקה סופית

| מצב | תוצאה |
|-----|--------|
| יש טקסט מעל המחיר (לא alt text) | broker (false) |
| אין טקסט מעל המחיר | private (true) |

