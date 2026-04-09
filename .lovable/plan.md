

## תוכנית תיקון מערכת ההתאמות — 4 נקודות

### נקודה 1: חילוץ פיצ'רים כבר מהסריקה הראשונה

**מצב נוכחי:** הפרסר של הסריקה הראשונה (`parser-utils.ts` → `extractFeatures`) מזהה פיצ'רים רק כ-`true` — אם מצא "חניה" בטקסט, מסמן `parking: true`. אם לא מצא — לא מסמן כלום (`undefined`). הפרסר הזה רץ על טקסט מרשימות (דפי חיפוש), שבדרך כלל מכילים מעט מידע על פיצ'רים.

**מה משתנה:**
- **`parser-utils.ts`** — הפונקציה `extractFeatures` תוסיף negative inference: אם הטקסט מכיל מילות מפתח של פיצ'רים אחרים (סימן שזה בלוק מפורט) אבל לא מזכיר חניה/מרפסת — תסמן `false`.
- הלוגיקה: אם הבלוק מכיל לפחות 2 פיצ'רים מוכרים (כלומר יש רשימת מאפיינים), כל פיצ'ר שלא מוזכר יסומן `false`.
- אם הבלוק קצר מדי ולא מכיל פיצ'רים כלל — לא מסמנים כלום (נשאר `undefined` לטיפול ב-backfill).

**קבצים:** `supabase/functions/_experimental/parser-utils.ts`

---

### נקודה 2: Negative Inference מלא ב-Backfill

**מצב נוכחי:** ה-backfill (`backfill-property-data-jina/index.ts`) מבצע negative inference רק למעלית (שורה 725-727). שאר הפיצ'רים נשארים `null` אם לא נמצאו.

**מה משתנה:**
- **`backfill-property-data-jina/index.ts`** — הרחבת ה-negative inference לכל 8 הפיצ'רים הקריטיים: parking, balcony, elevator, mamad, yard, roof, pets, storage.
- הלוגיקה: אם ה-backfill הצליח לגרד את הדף (יש markdown תקין) ולא מצא אזכור של הפיצ'ר, הוא יסומן `false`.
- **רק אם אין ערך קיים** — לא דורסים `true` שכבר נקבע.

**קוד לפני:**
```typescript
if (mergedFeatures.elevator !== true && !existingFeatures.elevator) {
  mergedFeatures.elevator = false;
}
```

**קוד אחרי:**
```typescript
const inferFalse = ['elevator', 'parking', 'balcony', 'mamad', 'yard', 'roof', 'storage', 'pets'];
for (const key of inferFalse) {
  if (mergedFeatures[key] !== true && !existingFeatures[key]) {
    mergedFeatures[key] = false;
  }
}
```

**קבצים:** `backfill-property-data-jina/index.ts`

---

### נקודה 3: Strict Matching — null = דחייה

**מצב נוכחי:** כשלקוח דורש פיצ'ר כחובה (`flexible: false`) והנכס הוא `null`, המערכת **מעבירה** אותו עם הערה "לא ידוע ⚠️". זו הסיבה שדירות בלי חניה מופיעות אצל שירי.

**מה משתנה:**
- **`matching.ts`** — שינוי בכל 8 בדיקות הפיצ'רים (שורות 414-570): אם `flexible === false` והערך הוא `null/undefined` → דחייה (`matchScore: 0`) במקום pass with warning.

**קוד לפני (דוגמה — חניה):**
```typescript
if (lead.parking_required && lead.parking_flexible === false) {
  if (property.features?.parking === false) {
    return { matchScore: 0, ... };  // reject
  }
  if (property.features?.parking === true) {
    reasons.push('יש חניה (חובה) ✓');
  } else {
    reasons.push('חניה - לא ידוע ⚠️');  // ← BUG: עובר!
  }
}
```

**קוד אחרי:**
```typescript
if (lead.parking_required && lead.parking_flexible === false) {
  if (property.features?.parking !== true) {
    return { matchScore: 0, matchReasons: ['נדרשת חניה - אין או לא ידוע'], priority: 0 };
  }
  reasons.push('יש חניה (חובה) ✓');
}
```

אותו שינוי ל: elevator, balcony, yard, roof, mamad, pets, furnished.

**קבצים:** `supabase/functions/_shared/matching.ts`

---

### נקודה 4: ניקוי התאמות קיימות שגויות

**בעיה:** אחרי התיקונים, יהיו אלפי התאמות ישנות ב-`matched_leads` שלא היו אמורות לעבור. צריך לנקות אותן.

**מה משתנה:**
- הפעלת ה-matching engine מחדש על כל הנכסים הפעילים (הפונקציה `run-matching` כבר קיימת)
- זה יחשב מחדש את ה-`matched_leads` לכל נכס לפי הלוגיקה החדשה
- התאמות שגויות ייעלמו אוטומטית

**ללא שינוי קוד** — רק הפעלה ידנית אחרי deploy של התיקונים.

---

### סדר ביצוע

1. תיקון backfill (negative inference לכל הפיצ'רים) — deploy
2. תיקון parser-utils (negative inference בסריקה ראשונה) — deploy
3. תיקון matching.ts (strict matching) — deploy
4. הרצת matching מחדש לניקוי התאמות ישנות

### מה לא משתנה
- שום UI
- שום טבלה בדאטאבייס
- לוגיקת סריקה (scouts)
- לוגיקת בדיקת זמינות

### סיכונים
- **ירידה זמנית בכמות התאמות** — נכסים שעדיין לא עברו backfill עם negative inference ייפלטרו. זה צפוי ורצוי — עדיף 10 התאמות מדויקות מ-44 עם 29 לא רלוונטיות.
- **אין סיכון לשבירה** — הלוגיקה משתנה רק בכיוון של "יותר מחמיר" בהתאמות. שום פיצ'ר אחר לא מושפע.

