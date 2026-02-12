

# תיקון: Deploy + באג ירידת מחיר

## בעיה 1: ה-Edge Function לא מעודכנת

ה-`safeIsPrivate` fix נמצא בקובץ `property-helpers.ts` אבל ה-deploy של `scout-yad2` לא כלל אותו.

**תיקון**: Deploy מחדש את `scout-yad2` ולוודא שה-shared files נכללים.

## בעיה 2: תגית "ירד ב-XXX ₪" בלי סוכנות מזוהה כתיווך

הלוגים מראים:
```
[Yad2] Broker detected: "ירד ב-650,000 ₪"
[Yad2] Broker detected: "ירד ב-300,000 ₪"
[Yad2] Broker detected: "ירד ב-200,000 ₪"
```

אלה מודעות **פרטיות** עם תגית ירידת מחיר. הטקסט "ירד ב-650,000 ₪" נמצא בין התמונה למחיר, ולכן הלוגיקה הפשוטה שלנו חושבת שזה שם סוכנות.

**תיקון**: אחרי חילוץ `textBetween`, צריך לנקות ממנו תגיות ירידת מחיר (regex: `ירד ב-[\d,]+\s*₪`). אם אחרי הניקוי לא נשאר טקסט משמעותי — זה פרטי.

### קובץ: `supabase/functions/_experimental/parser-yad2.ts`

בבלוק שמחשב את `textBetween` (שורות 247-253), הוספת ניקוי נוסף:

```typescript
const textBetween = block.substring(imgEndPos, shekelIndex)
  .replace(/[\u200F\u200E\u200B]/g, '')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')  // Strip markdown images
  .replace(/ירד ב-?[\d,]+\s*₪/g, '')    // Strip price-drop tags
  .replace(/בלעדי/g, '')                  // Strip "exclusive" tag
  .replace(/חדש מקבלן/g, '')              // Strip "new from builder" tag
  .replace(/\\/g, '')
  .replace(/\n/g, ' ')
  .trim();
```

הוספת `בלעדי` ו-`חדש מקבלן` כי אלה תגיות של הפלטפורמה, לא שמות סוכנות. אם אחרי הסרת כל התגיות נשאר טקסט — זה שם הסוכנות (תיווך). אם לא נשאר כלום — פרטי.

## בעיה 3: ה-boolean error עדיין קיים

למרות ש-`safeIsPrivate` בקוד, הפונקציה שרצה היא הגרסה הישנה. ה-deploy מחדש אמור לפתור את זה.

## סיכום שינויים

| קובץ | שינוי |
|------|-------|
| `parser-yad2.ts` | strip "ירד ב-XXX ₪", "בלעדי", "חדש מקבלן" מ-textBetween |
| `scout-yad2` | deploy מחדש כדי שכל השינויים יהיו פעילים |

