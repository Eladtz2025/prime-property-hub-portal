

# תיקון 3 באגים בסריקות Jina

## 1. באג ריצות כפולות - trigger-scout-pages-jina

**הבעיה:** שורה 63 קוראת `created_at` אבל העמודה לא קיימת בטבלת `scout_runs` - העמודה הנכונה היא `started_at`. בגלל זה הבדיקה לריצה קיימת תמיד נכשלת בשקט ומאפשרת ריצות כפולות.

**התיקון:** בשורות 63 ו-69 - שינוי `created_at` ל-`started_at`.

### קובץ: `supabase/functions/trigger-scout-pages-jina/index.ts`

```
// שורה 63: שינוי select
.select('id, created_at')  -->  .select('id, started_at')

// שורה 69: שינוי חישוב הגיל
Date.now() - new Date(existingRun.created_at).getTime()
-->
Date.now() - new Date(existingRun.started_at).getTime()
```

---

## 2. X-Wait-For-Selector שגוי במדלן

**הבעיה:** שורה 20 משתמשת בסלקטור של יד2 (`a[href*="/realestate/item/"]`) במקום הסלקטור של מדלן.

**התיקון:** שינוי ל-`a[href*="/listings/"]` שמתאים לדפי רשימה של מדלן.

### קובץ: `supabase/functions/scout-madlan-jina/index.ts`

```
// שורה 20:
'X-Wait-For-Selector': 'a[href*="/realestate/item/"]'
-->
'X-Wait-For-Selector': 'a[href*="/listings/"]'
```

---

## 3. AbortController timeout - 35 שניות

**הבעיה:** ה-AbortController מוגדר ל-60 שניות (שורה 12), מה שאומר שניסיון כושל תוקע את הפונקציה דקה שלמה לפני שממשיך הלאה.

**התיקון:** שינוי ל-35000ms (35 שניות) כדי שיהיה מעט מעל ה-X-Timeout של 30 שניות (ברירת המחדל), ולא יחכה יותר מדי.

### קובץ: `supabase/functions/scout-madlan-jina/index.ts`

```
// שורה 12:
setTimeout(() => controller.abort(), 60000)
-->
setTimeout(() => controller.abort(), 35000)
```

---

## פריסה

פריסה מחדש של שתי הפונקציות:
- `trigger-scout-pages-jina`
- `scout-madlan-jina`

