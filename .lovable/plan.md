

## עדכון scout-yad2-jina לשימוש ב-Vercel Proxy

### הבעיה
הפונקציה `scout-yad2-jina` משתמשת ב-Jina Reader שנחסם ע"י WAF של יד2 (403). יצרנו proxy ב-Vercel (`api/yad2-proxy.js`) שמבצע את הבקשה מ-IP של Vercel Edge.

### אתגר טכני חשוב
ה-proxy מחזיר **HTML גולמי**, אבל הפארסר הקיים (`parseYad2Markdown`) מצפה ל-**Markdown** (פורמט Jina). יד2 הוא אפליקציית Next.js, ולכן ה-HTML מכיל תג `<script id="__NEXT_DATA__">` עם כל נתוני הנכסים כ-JSON מובנה — שזה בעצם **טוב יותר** מפירוס Markdown.

### תוכנית — 2 שלבים

**שלב 1: עדכון פונקציית הסריקה** (`scout-yad2-jina/index.ts`)
- החלפת `scrapeYad2WithJina` בפונקציה חדשה `scrapeYad2ViaProxy` שקוראת ל:
  `https://www.ctmarketproperties.com/api/yad2-proxy`
- שליחת POST עם `{ url }` וה-header `x-proxy-key` מה-secret
- קבלת HTML בחזרה

**שלב 2: פארסר HTML חדש ליד2** (`_experimental/parser-yad2-html.ts`)
- חילוץ `__NEXT_DATA__` JSON מה-HTML
- פירוס נכסים מה-JSON המובנה (כתובת, מחיר, חדרים, קומה, שטח, פרטי/תיווך)
- אם `__NEXT_DATA__` לא נמצא — fallback לפירוס ה-HTML ישירות
- ממשק זהה: מחזיר `ParserResult` עם אותו מבנה בדיוק

### קבצים שישתנו

| # | קובץ | שינוי |
|---|-------|-------|
| 1 | `supabase/functions/scout-yad2-jina/index.ts` | החלפת `scrapeYad2WithJina` ב-`scrapeYad2ViaProxy`, שימוש בפארסר HTML במקום Markdown |
| 2 | `supabase/functions/_experimental/parser-yad2-html.ts` | **חדש** — פארסר HTML/JSON ליד2 |

### מה לא משתנה
- `api/yad2-proxy.js` — כבר קיים ומוכן
- `parser-yad2.ts` — נשאר כ-fallback
- כל הלוגיקה של chaining, retry, run management — ללא שינוי
- scout של מדל"ן והומלס — **ללא שינוי כלל**
- `validateScrapedContent` — ישתמש ב-HTML במקום markdown

### סדר עבודה
1. יצירת הפארסר החדש
2. עדכון `scout-yad2-jina` — רק החלפת פונקציית הסריקה
3. Deploy ובדיקה עם `curl_edge_functions`
4. בדיקת לוגים לוודא שהפרוקסי עובד ושהפארסר מחלץ נכסים

**3 קבצים (1 חדש + 1 עדכון + proxy קיים), ללא שינוי בשום מערכת אחרת.**

