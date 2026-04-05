

## שחזור scout-yad2-jina לגרסת Jina המקורית

### מה משתנה
הפונקציה `scout-yad2-jina/index.ts` עברה לשימוש ב-Vercel Proxy + HTML parser. צריך להחזיר אותה לשימוש ב-Jina Reader (free tier) + Markdown parser — בדיוק כמו שהיה לפני השינויים.

### שינויים בקובץ אחד: `supabase/functions/scout-yad2-jina/index.ts`

1. **הסרת קוד הפרוקסי** — מחיקת `VERCEL_PROXY_URL`, `ProxyScrapeResult`, ופונקציית `scrapeYad2ViaProxy` (שורות 9-62)
2. **החזרת import של Jina** — `import { scrapeWithJina } from "../_shared/scraping-jina.ts"`
3. **החזרת import של Markdown parser** — `import { parseYad2Markdown } from "../_experimental/parser-yad2.ts"` במקום `parseYad2Html`
4. **שינוי לוגיקת הסריקה** — שימוש ב-`scrapeWithJina(url, 'yad2', MAX_RETRIES)` שמחזיר markdown, ואז `parseYad2Markdown(markdown, ...)` לפירוק
5. **עדכון validation** — `validateScrapedContent(markdown, undefined, 'yad2')` במקום HTML
6. **עדכון debug sample** — שמירת markdown במקום html

### מה לא משתנה
- כל לוגיקת ה-chaining, retry, run management — ללא שינוי
- הומלס, מדל"ן — ללא שינוי
- `scraping-jina.ts` — ללא שינוי
- `parser-yad2.ts` — כבר קיים ועובד

### קובץ אחד בלבד, שחזור למצב שעבד לפני כן.

