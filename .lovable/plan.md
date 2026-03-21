

## טיפול בהגבלת קצב של Jina — עיבוד סדרתי עם השהייה

### ניתוח המצב הנוכחי
- Jina Free Tier = **20 בקשות בדקה**
- המערכת מעבדת ב-**batches מקביליים של 3** עם 1.5 שניות בין באצ'ים
- 3 בקשות כל 1.5 שניות = ~120 RPM — **פי 6 מהמגבלה**
- **מדלן לא משתמש ב-Jina** (Direct Fetch) — רק יד2 והומלס מושפעים

### הפתרון — הפרדה בין מדלן ל-Jina
במקום concurrency גורף, נפריד את הלוגיקה:

**`check-property-availability-jina/index.ts`** — שינוי ב-`processPropertiesInParallel`:
1. **מדלן** — ממשיך במקביל (concurrency 3) כי לא עובר דרך Jina ואין מגבלת קצב
2. **יד2 + הומלס** — עיבוד **סדרתי** (אחד-אחד) עם **השהייה של 3.5 שניות** בין בקשות = ~17 RPM, בטוח מתחת ל-20

### איך זה עובד
```text
קלט: [madlan1, yad2_1, madlan2, yad2_2, homeless1, madlan3, yad2_3]
         ↓
   מפצלים לשתי קבוצות:
   
   מדלן (Direct):  [m1, m2, m3] → מקביל (3 בו-זמנית)
   Jina (יד2+הומלס): [y1, y2, h1, y3] → סדרתי + 3.5s delay
         ↓
   מאחדים תוצאות
```

### יתרונות
- **אפס rate limiting** — נשארים בטוח מתחת ל-20 RPM
- **מדלן לא מואט** — ממשיך מהר כמו קודם
- **לא צריך באצ'ים** — פשוט סדרתי עם delay
- **שינוי מינימלי** — רק הפונקציה `processPropertiesInParallel` משתנה

### פרטים טכניים
**קובץ**: `supabase/functions/check-property-availability-jina/index.ts`

החלפת `processPropertiesInParallel` בלוגיקה חדשה:
- פיצול `properties` ל-`madlanProps` ו-`jinaProps` לפי `source`
- מדלן: `Promise.allSettled` עם concurrency limit (כמו היום)
- Jina: לולאה סדרתית עם `await sleep(3500)` בין כל בדיקה
- הרצה במקביל של שתי הקבוצות (`Promise.all([madlanBatch, jinaSequential])`)
- איחוד התוצאות

