

# בדיקת API ישיר של יד2 — ניסיון חוזר עם גישות שונות

## מה אעשה

אעדכן את `test-direct-fetch/index.ts` לבדוק **5 גישות שונות** לגישה ל-API של יד2 מ-Edge Function:

### גישה 1 — `gw.yad2.co.il/realestate-item/{token}` (headers מינימליים)
רק `Accept: application/json` — בודק אם חוסמים לפי headers

### גישה 2 — `gw.yad2.co.il/realestate-item/{token}` (headers כמו דפדפן)
הוספת `Referer`, `Origin`, `User-Agent` מלא — כמו שעבד לנו עם מדל"ן

### גישה 3 — Feed Search API
`gw.yad2.co.il/feed-search/realestate/rent?token={token}` — endpoint אחר שאולי לא חסום

### גישה 4 — HTML ישיר + `__NEXT_DATA__`
Fetch של דף ה-HTML עם חילוץ `__NEXT_DATA__` (כמו שעשינו עם מדל"ן) — יד2 גם אתר Next.js

### גישה 5 — `api.yad2.co.il` (דומיין אחר)
בדיקה אם יש endpoint ישן/חלופי בדומיין `api.yad2.co.il`

## אחרי הבדיקה
אציג תוצאות — מה עבד, מה לא, ואיזו גישה נותנת את הנתונים הכי טובים. אם אחת מצליחה — אבנה parser ישיר שמחליף את Jina בבקפיל.

## קבצים שישתנו

| קובץ | פעולה |
|---|---|
| `supabase/functions/test-direct-fetch/index.ts` | עדכון לבדיקת 5 גישות |

**שום קוד production לא ישתנה** — רק פונקציית הבדיקה.

