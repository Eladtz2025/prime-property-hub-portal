## ההמלצה שלי: כן, ללכת על זה — בזהירות

המתכנת שלך צודק לחלוטין בעיקרון, וההצעה שלו מבוססת על קוד שאכן **קיים ועובד** אצלנו (`madlan-detail-parser.ts` משיג ~88% הצלחה עם בדיוק אותם headers שהוא מציע). זה הפתרון הכי הגיוני כרגע: ללא JINA_API_KEY בתשלום, ללא תלות חיצונית, מבוסס על דפוס מוכח.

**אבל** — יש כמה דברים שהוא לא ציין שצריך לטפל בהם, אחרת הסורק יישבר בייצור.

---

## מה הוא צדק בו

1. **Headers מינימליים עובדים**: ה-`madlan-detail-parser.ts` שלנו משתמש בדיוק ב-`Accept`, `X-Nextjs-Data: 1`, `Accept-Language` בלבד — ומשיג ~88% הצלחה. אותו דפוס יעבוד גם לדפי חיפוש.
2. **Next.js JSON עדיף על HTML**: `__NEXT_DATA__` מחזיר את כל הנכסים בדף בבת אחת, מובנה — בלי regex שביר.
3. **לא להוסיף User-Agent/Referer/Origin**: זה נכון, ה-WAF של מדל"ן באמת מגיב הפוך לאלה.
4. **88% הצלחה עדיף על 0%**: כרגע הסורק מחזיר אפס נכסים מאז 25/04. כל שיפור הוא רווח נטו.

## מה הוא פספס / מה צריך להוסיף

1. **Next.js URL נכון לדפי חיפוש**: בקשה רגילה ל-`/for-rent/...?page=1` עם `X-Nextjs-Data` תחזיר HTML, לא JSON. כדי לקבל JSON ישיר צריך URL בפורמט `/_next/data/<buildId>/he/for-rent/...json`. ה-`buildId` משתנה בכל deploy של מדל"ן. **פתרון**: בקשה ראשונה ל-HTML, חילוץ `buildId` מתוך `__NEXT_DATA__`, ואז שימוש בו לדפים הבאים. זה גם מה שעובד ב-detail-parser שלנו (בודק שני המסלולים: JSON ו-HTML).
2. **ניתוח מבנה ה-JSON**: הוא לא ציין איפה בתוך ה-JSON נמצאת רשימת הנכסים. צריך מחקר קצר על המבנה (`pageProps.searchPoiList` או דומה) — אעשה זאת מתוך תגובה אמיתית.
3. **בדיקת CF challenge**: גם בדפי חיפוש Cloudflare יכול לחסום (במיוחד ברצף בקשות מהירות). צריך להשאיר את `isCloudflareChallenge` ושיהוי בין דפים (8 שניות, כמו ב-Jina היום).
4. **Fallback**: אם ה-JSON לא נטען, לחזור לפרסור HTML עם regex — בדיוק כמו שעושה `madlan-detail-parser.ts`.

---

## תוכנית הפעולה

### 1. יצירת `supabase/functions/scout-madlan-nextjs/index.ts`
פונקציה חדשה (לא נוגע ב-`scout-madlan-jina` הקיים, נשמור אותו כ-fallback אפשרי לעתיד):

- **Headers** (זהים ל-detail-parser שעובד):
  ```
  Accept: application/json, text/html
  X-Nextjs-Data: 1
  Accept-Language: he-IL,he;q=0.9
  ```
- **Flow לכל דף**:
  1. Fetch של URL החיפוש (`buildSinglePageUrl('madlan', config, page)`).
  2. אם התגובה HTML → לחלץ `<script id="__NEXT_DATA__">{...}</script>` עם regex.
  3. אם התגובה JSON ישיר → `JSON.parse` ישירות.
  4. ניווט במבנה ה-JSON אל רשימת ה-POIs (אזהה מבנה אמיתי בזמן הפיתוח על-ידי לוג ראשוני).
  5. לכל POI: לחלץ `id`, `price`, `rooms`, `size`, `address`, `city`, `neighborhood`, `pocType`, `images`, ולהעביר ל-`saveProperty()` הקיים — בדיוק כמו `scout-madlan-jina`.
- **Anti-block**: 
  - זיהוי CF challenge → retry עם השהייה 20 שניות.
  - מקסימום 2 retries לדף.
  - השהייה 8 שניות בין דפים (sequential mode כבר במקום).

### 2. עדכון Trigger
ב-`supabase/functions/trigger-scout-pages-jina/index.ts` שורה 107-109:
```ts
const targetFunction = source === 'madlan' 
  ? 'scout-madlan-nextjs' 
  : `scout-${source}-jina`;
```

### 3. בדיקה בייצור (mini-test)
- ריצה ידנית של דף אחד דרך הדשבורד.
- בדיקת לוגים: כמה נכסים נמצאו, אם יש CF blocks, אם המבנה JSON נקלט.
- אם עובד → להריץ מלא (10 דפים).

### 4. שמירת fallback
לא מוחקים את `scout-madlan-jina` ואת `scout-madlan-direct`. אם המתכנת בעתיד יחדש את חשבון ה-Jina או נמצא פתרון אחר — הם זמינים. רק ה-router בטריגר משתנה.

---

## מה לא נעשה

- **לא** מוסיפים שירות חיצוני בתשלום (תואם ל-`mem://constraints/no-external-paid-services`).
- **לא** משנים את scout-yad2-jina או scout-homeless-jina — הם נושא נפרד.
- **לא** מוחקים את הסורקים הקיימים.

---

## סיכון

- אם מבנה ה-JSON של מדל"ן ישתנה בעתיד (Next.js rebuild) — נצטרך לעדכן את הניווט במבנה. אבל זה אותו סיכון שיש לנו היום ב-`madlan-detail-parser.ts`, שעובד יציב כבר חודשים.
- שיעור הצלחה צפוי: דומה ל-detail parser (~80-90%), עדיף בהרבה מ-0% הנוכחי.

לאישורך — אם תאשר אבנה את הפונקציה, אעדכן את ה-router, ואריץ mini-test.