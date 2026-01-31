
# תיקון מערכת בדיקת זמינות נכסים

## הבעיה שהתגלתה

פונקציית `trigger-availability-check` עושה timeout ולא מצליחה לרוץ בכלל:

| מדד | ערך |
|-----|-----|
| נכסים לבדיקה | 5,204 |
| batches (100 נכסים כל אחד) | 52 |
| delay בין batches | 1.5 שניות |
| זמן נדרש | ~78 שניות |
| Edge Function timeout | 60 שניות |

**תוצאה:** הפונקציה לא מסתיימת בזמן, אף נכס לא נבדק, אין לוגים.

## פתרון: שינוי ארכיטקטורה ל-"Fast Trigger + Background Batches"

במקום שה-trigger ישלח את כל ה-batches, הוא ישלח רק batch קטן ויתזמן את עצמו לריצה נוספת.

### שינוי הלוגיקה:

**לפני (הבעיה):**
```
trigger → שולח 52 batches → timeout
```

**אחרי (הפתרון):**
```
trigger → שולח 3-5 batches → מתזמן את עצמו לעוד 5 דקות → חוזר
```

### קוד מעודכן (`trigger-availability-check`):

```typescript
// במקום לשלוח את כל ה-batches:
const MAX_BATCHES_PER_RUN = 5;  // שולח רק 5 batches בכל ריצה

for (let i = 0; i < Math.min(batches.length, MAX_BATCHES_PER_RUN); i++) {
  // Fire and forget each batch
  fetch(`${supabaseUrl}/functions/v1/check-property-availability`, {...});
  triggeredCount++;
  await sleep(200);  // delay קצר יותר
}

// אם יש עוד batches - מתזמן קריאה עצמית
if (batches.length > MAX_BATCHES_PER_RUN) {
  const remainingIds = batches.slice(MAX_BATCHES_PER_RUN).flat();
  fetch(`${supabaseUrl}/functions/v1/trigger-availability-check`, {
    body: JSON.stringify({ property_ids: remainingIds })
  });
}
```

### אלטרנטיבה: שימוש ב-Cron תכוף יותר

במקום לשנות את הארכיטקטורה, אפשר:
1. לשנות את ה-Cron לרוץ כל שעה במקום פעם ביום
2. לעבד רק ~500 נכסים בכל ריצה (5 batches)
3. במשך 24 שעות נבדוק את כל הנכסים

## מערכת זיהוי כפילויות - סטטוס ✅

המערכת עובדת טוב:

| שלב | סטטוס |
|-----|-------|
| זיהוי בסריקה | ✅ `saveProperty()` קורא ל-`find_property_duplicate` |
| סנכרון matches | ✅ `match-batch` מעדכן כל הכפילויות בקבוצה |
| זיהוי רטרואקטיבי | ✅ כפתור "זהה כפילויות" בממשק הניהול |

**סטטיסטיקה:** 617 נכסים (12%) כבר מזוהים כחלק מקבוצות כפילויות.

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/functions/trigger-availability-check/index.ts` | שינוי לארכיטקטורת batches מוגבלת + self-trigger |
| SQL (cron) | אופציונלי - להריץ כל שעה במקום פעם ביום |

## תוצאה צפויה

- הפונקציה תסתיים תוך 10-15 שניות (במקום timeout)
- כל הנכסים ייבדקו במשך מספר ריצות
- נכסים שהוסרו יזוהו אוטומטית ויסומנו כ-inactive
