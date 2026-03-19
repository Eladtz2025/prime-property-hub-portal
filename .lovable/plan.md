

## בעיה: מודעות שהוסרו במדל"ן לא מזוהות ב-Direct Fetch

### מה קורה
- Direct Fetch מקבל 200 OK עם 90KB של HTML מ-`madlan.co.il/listings/z4IWIDCeeTj`
- הטקסט "המודעה הוסרה" **לא קיים ב-SSR HTML** — הוא מרונדר רק ע"י JavaScript בדפדפן
- בדפדפן: JS מזהה שהמודעה הוסרה → מציג באנר "המודעה הוסרה" → מפנה לדף תוצאות חיפוש
- ב-Direct Fetch: ה-HTML נראה כמו דף תקין → מסומן `content_ok` בטעות

### שלב 1: חקירה — לגלות מה יש ב-HTML
ניצור Edge Function זמנית (`debug-fetch-html`) שתעשה fetch לURL של מדל"ן ותחזיר:
- `<title>` tag
- כל ה-`<meta>` tags (og:title, og:description, וכו')
- תוכן `__NEXT_DATA__` אם קיים (מדל"ן מבוסס Next.js — הנתונים בדרך כלל מוטמעים כ-JSON ב-script tag)
- 500 התווים הראשונים והאחרונים של ה-body

**למה**: אם מדל"ן מבוסס Next.js, יש סיכוי גבוה שב-`__NEXT_DATA__` יש שדה סטטוס (כמו `isRemoved`, `status: "deleted"`) שנוכל לבדוק — גם בלי להריץ JavaScript.

### שלב 2: תיקון (בהתאם לממצאים)
בהתאם למה שנמצא ב-HTML, נוסיף אסטרטגיית זיהוי חדשה ל-`checkMadlanDirect`:

**אפשרות א'** — אם `__NEXT_DATA__` מכיל סטטוס:
```
Strategy 5: Parse __NEXT_DATA__ JSON for removal status
```

**אפשרות ב'** — אם אין מידע ב-JSON, נבדוק **היעדר תוכן** ספציפי למודעה:
```
Strategy 5: If no listing-specific content found (price, rooms, etc.) → mark inactive
```
(הפונקציה `hasMadlanListingSpecificContent` כבר קיימת ב-availability-indicators.ts)

### קבצים
1. `supabase/functions/debug-fetch-html/index.ts` — **חדש, זמני** — לחקירת ה-HTML
2. `supabase/functions/check-property-availability-jina/index.ts` — הוספת אסטרטגיה חדשה (אחרי שלב 1)
3. `supabase/functions/_shared/availability-indicators.ts` — אולי עדכון לפי הממצאים

