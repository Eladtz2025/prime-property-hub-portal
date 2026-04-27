## מה אני בונה (בדיוק לפי הבריף)

### 1. פונקציה חדשה: `supabase/functions/scout-madlan-nextjs/index.ts`

**Headers (מינימליים בלבד, ללא User-Agent/Referer/Origin):**
```
Accept: text/html
X-Nextjs-Data: 1
Accept-Language: he-IL,he;q=0.9
```

**Flow:**
1. GET לכתובת החיפוש של מדל"ן (URL נבנה דרך `buildSinglePageUrl('madlan', config, page)` הקיים).
2. חילוץ `<script id="__NEXT_DATA__">{...}</script>` מה-HTML.
3. `JSON.parse` וניווט אל רשימת ה-POIs (זיהוי מדויק של הנתיב יתבצע מתוך תגובה אמיתית — אקליל לוג ראשוני אם המבנה לא יזוהה).
4. לכל נכס: חילוץ `id, price, rooms, size, address, city, neighborhood, pocType, images` והעברה ל-`saveProperty()` הקיים (אותו זרימה כמו `scout-madlan-jina`).
5. זיהוי `isCloudflareChallenge` — אם נחסם, retry אחד עם השהייה 20ש'.
6. עדכון `page_stats` ב-`scout_runs` כמו שאר הסורקים.
7. בסוף הדף — טריגר לדף הבא (sequential, השהייה לפי `page_delay_seconds` של הקונפיג).

### 2. עדכון `trigger-scout-pages-jina/index.ts` (שורה ~108)

```ts
const targetFunction = source === 'madlan' 
  ? 'scout-madlan-nextjs' 
  : `scout-${source}-jina`;
```

### 3. מה לא נוגע

- `scout-madlan-jina` ו-`scout-madlan-direct` נשארים בקוד (לא נמחקים) — fallback עתידי.
- `scout-yad2-jina` ו-`scout-homeless-jina` ללא שינוי.
- אין שינוי DB, אין secrets חדשים, אין שירות חיצוני.

### 4. אחרי הבנייה

- Deploy של שתי הפונקציות.
- ריצה ידנית של דף 1 דרך הדשבורד.
- בדיקת לוגים: כמה נכסים נקלטו, האם CF חסם, האם המבנה JSON זוהה.
- אם המבנה JSON אחר ממה שציפינו — תיקון ממוקד לפי הלוג בפועל.

### סיכון ידוע

הבדיקה הקודמת שהרצתי הראתה ש-Cloudflare מחזיר 403 על דפי חיפוש מ-IP של Supabase גם עם הגישה הזו. ייתכן ונקבל את אותה תוצאה. **בכל זאת, לפי בקשתך, אני בונה ובודק מול הייצור — אם ייכשל, נתקן משם.**