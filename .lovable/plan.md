

## תוכנית תיקון מערכת ההתאמות — טיפול ב-null כ"לא ידוע"

### הבעיה המרכזית

כש-lead דורש פיצ'ר בצורה **חובה** (למשל מרפסת, `flexible=false`), המערכת בודקת:
```typescript
if (property.features?.balcony !== true) → REJECT
```

**נתונים אמיתיים:**
- מרפסת: 783 נכסים עם `true`, 130 עם `false`, **3,126 עם null** (77%)
- ממ"ד: 519 נכסים עם data, **3,520 עם null** (87%)
- חיות: רק 6 נכסים עם data

11 לקוחות דורשים מרפסת חובה, 8 חניה חובה, 8 מעלית חובה — וכולם מפסידים את 77% מהנכסים שפשוט **לא ידוע** אם יש בהם מרפסת.

**בעיה נוספת:** 26 לקוחות עם תאריך כניסה שעבר עדיין eligible — מזבזבים חישובי matching.

### הפתרון — שינוי ב-`matching.ts` בלבד

**עיקרון:** כש-null — לא לדחות, אלא להוסיף הערה "לא ידוע" ולתת ציון priority נמוך יותר.

#### שינוי 1: פיצ'רים עם null עוברים עם הערה (לא נדחים)

לכל בדיקת פיצ'ר חובה (elevator, parking, balcony, yard, roof, mamad, pets, furnished), במקום:
```typescript
if (property.features?.balcony !== true) {
  return { matchScore: 0, ... } // REJECT
}
```
ישתנה ל:
```typescript
if (property.features?.balcony === false) {
  return { matchScore: 0, ... } // REJECT - explicitly no balcony
}
if (property.features?.balcony !== true) {
  reasons.push('מרפסת - לא ידוע ⚠️');
  // Continue - don't reject
} else {
  reasons.push('יש מרפסת (חובה) ✓');
}
```

**ההבדל:** `false` (מפורש שאין) = דחייה. `null/undefined` (לא ידוע) = עובר עם הערה.

#### שינוי 2: Priority penalty ל-null features

בפונקציית `calculatePriorityScore`, נכסים עם features לא ידועים יקבלו priority נמוך יותר:
```typescript
// For each required strict feature with null data: -5 priority
if (lead.balcony_required && !lead.balcony_flexible && property.features?.balcony == null) {
  priority -= 5;
}
```
ככה נכסים עם מידע מלא יופיעו ראשונים, ונכסים עם "לא ידוע" יופיעו אחריהם.

#### שינוי 3: outdoor_space_any (OR mode) עם null

אותו עיקרון — אם אף אחד מהפיצ'רים לא `false` מפורש אבל כולם `null`, הנכס עובר עם הערה.

### מה לא משתנה
- שום UI לא משתנה
- שום edge function אחרת
- שום טבלה בדאטאבייס
- לוגיקת עיר/שכונה/מחיר/חדרים — ללא שינוי
- לוגיקת תאריך כניסה — ללא שינוי
- `match-batch/index.ts` — ללא שינוי

### סיכון
**אפס שבירה** — הלוגיקה משתנה רק בכיוון של "יותר התאמות" (פחות דחיות). נכסים שכבר הותאמו ימשיכו להיות מותאמים. נכסים שנדחו בגלל null עכשיו יעברו עם הערה ⚠️ שנראית ברשימת ההתאמות.

### השפעה צפויה
- **לפני:** ~266 נכסים עם התאמות, ממוצע 1.9 לידים
- **אחרי:** צפוי גידול משמעותי — אלפי נכסים שנדחו רק בגלל null יוכלו להתאים
- ה-priority score יבטיח שנכסים עם מידע מלא ימוקמו גבוה יותר

### קובץ אחד בלבד
`supabase/functions/_shared/matching.ts` — שינוי בלוגיקת הבדיקה של ~8 פיצ'רים + penalty ב-priority score.

