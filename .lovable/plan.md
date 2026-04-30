## הבעיה האמיתית בשורה אחת

הקוד **כבר** מנסה לרוץ אחד-אחד עם דיליי, אבל יש שורה אחת שמקלקלת את זה:

```typescript
// check-property-availability-jina/index.ts שורה 336
const [madlanResults, jinaResults] = await Promise.all([
  processMadlanParallel(),    // 1 madlan כל 6s
  processJinaSequential(),    // 1 jina כל 3.5s
]);
```

`Promise.all` גורם לשני הזרמים לרוץ **במקביל** - אז madlan + jina נשלחים בו-זמנית, וכשיש chains כפולים זה הופך ל-burst.

## ההצעה: שני שינויים זעירים בקובץ אחד

**קובץ:** `supabase/functions/check-property-availability-jina/index.ts` בלבד.

### שינוי 1: הפיכת Madlan→Jina לסדרתי (שורה 336)

```typescript
// לפני:
const [madlanResults, jinaResults] = await Promise.all([
  processMadlanParallel(),
  processJinaSequential(),
]);

// אחרי:
const madlanResults = await processMadlanParallel();
const jinaResults = await processJinaSequential();
const allResults = [...madlanResults, ...jinaResults];
```

**תוצאה:** רק נכס אחד נשלח ברגע נתון - madlan קודם (אחד-אחד, 3s דיליי), אז jina (אחד-אחד, 3s דיליי).

### שינוי 2: דיליי אחיד 3 שניות (שורות 271 ו-307)

```typescript
// Madlan: שורה 271
const delayBetweenBatches = 3000; // היה 6000

// Jina: שורה 307
const JINA_DELAY_MS = 3000; // היה 3500
```

3 שניות בין כל בקשה = 20 בקשות בדקה (בדיוק במגבלת Jina, וגם בטוח ל-Madlan WAF).

### חישוב זמן batch של 10 נכסים
- היום (במקביל + race): 25-35 שניות עם הרבה rate_limited
- אחרי (סדרתי 3s): 10 × 3 = **30 שניות** עם 0 race

## מה לא משתנה
- **קובץ אחד בלבד** נוגע (`check-property-availability-jina/index.ts`)
- **0 שינויי DB**
- **0 שינוי schema**
- ה-headers של Madlan
- `trigger-availability-check-jina` (שזה הקובץ הקריטי עם cron/watchdog/lock)
- כל פונקציה אחרת במערכת
- ה-UI

## אם משהו ישתבש
מחזירים את 3 השורות לקדמותן בעריכה אחת. מקסימום 30 שניות לחזור אחורה.

## מה אני מבקש
אישור לשינוי **3 שורות** בקובץ אחד. ללא נגיעה ב-DB, ללא נגיעה בקוד אחר.

מאשר?
