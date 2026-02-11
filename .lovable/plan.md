

# תיקון מערכת בדיקת זמינות נכסים

## הבעיה
מערכת בדיקת הזמינות נתקעת מ-7/2. מתוך 36 ריצות ב-3 ימים האחרונים, 32 נכשלו בגלל timeout. הסיבה: ההגדרות הנוכחיות מאפשרות ל-batch בודד להימשך עד 225 שניות, חריגה מגבול ה-Edge Function.

## חישוב הבעיה
```text
batch_size=12, concurrency=4 -> 3 chunks
per_property_timeout=25s x firecrawl_max_retries=3 = 75s per property (worst case)
3 chunks x 75s = 225s per batch
3 batches x 225s = 675s total -> Edge Function timeout (~300s) exceeded
```

## הפתרון: 3 שינויים

### 1. הקטנת הגדרות (עדכון DB - ללא קוד)
עדכון `scout_settings` בטבלה:
- `batch_size`: 12 -> **6** (חצי, פחות עבודה לכל batch)
- `firecrawl_max_retries`: 3 -> **1** (ללא retries - אם Firecrawl נכשל, נדלג ונבדוק בריצה הבאה)
- `per_property_timeout_ms`: 25000 -> **15000** (15 שניות מספיקות)
- `concurrency_limit`: 4 -> **3** (מפחית עומס על Firecrawl)

חישוב חדש:
```text
batch_size=6, concurrency=3 -> 2 chunks
per_property_timeout=15s x retries=1 = 15s per property
2 chunks x 15s = 30s per batch
3 batches x 30s = 90s total -> בטוח בתוך 300s
```

### 2. הוספת Global Timeout ב-check-property-availability
שינוי בקובץ `supabase/functions/check-property-availability/index.ts`:
- הוספת timeout גלובלי של **50 שניות** לכל הפונקציה
- אם הפונקציה עדיין רצה אחרי 50s, היא מחזירה מה שהספיקה ועוצרת
- כך מובטח שהפונקציה תמיד מסיימת בזמן

### 3. HEAD-first לפני Firecrawl
שינוי בקובץ `supabase/functions/check-property-availability/index.ts`:
- לפני קריאה ל-Firecrawl (יקר ואיטי), בדיקת HEAD request מהירה (3 שניות)
- אם HEAD מחזיר 404/410 -> סיימנו, לא צריך Firecrawl
- אם HEAD מחזיר redirect להומפייג' -> סיימנו
- רק אם HEAD מחזיר 200 -> ניגש ל-Firecrawl לבדיקת תוכן
- זה חוסך קריאות Firecrawl מיותרות ומהיר פי 5-10

## קבצים לשינוי

### `supabase/functions/check-property-availability/index.ts`
- הוספת `GLOBAL_TIMEOUT_MS = 50000` (50 שניות)
- עטיפת כל הלוגיקה ב-`Promise.race` עם global timeout
- הוספת שלב HEAD-first לפני Firecrawl ב-`checkSingleProperty`
- החזרת תוצאות חלקיות אם נגמר הזמן (במקום להיתקע)

### עדכון DB (scout_settings)
- `batch_size` -> 6
- `firecrawl_max_retries` -> 1
- `per_property_timeout_ms` -> 15000
- `concurrency_limit` -> 3

## תוצאה צפויה
- כל ריצה תסתיים תוך **90 שניות** (במקום להיתקע)
- ריצות שנכשלות בגלל timeout ירדו מ-90% ל-~0%
- נכסים שלא נבדקו (Firecrawl timeout) ייבדקו בריצה הבאה (כל 10 דקות)
- מהירות עיבוד: ~18 נכסים לריצה x 6 ריצות בשעה = ~108 נכסים/שעה

