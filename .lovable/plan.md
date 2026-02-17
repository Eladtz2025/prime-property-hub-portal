
# שכפול מערכת הסריקות עם Jina -- כולל הומלס

## סקירה
שכפול 5 Edge Functions של מערכת הסריקות, החלפת Firecrawl ב-Jina Reader. **הומלס נכלל** -- Jina תחזיר HTML (עם `X-Return-Format: html`) כך שהפרסר הקיים `parseHomelessHtml` ימשיך לעבוד כרגיל.

## קבצים חדשים (6)

### 1. `supabase/functions/_shared/scraping-jina.ts`
פונקציה משותפת שמחליפה את `scrapeWithRetry` + `getActiveFirecrawlKey`:
- `scrapeWithJina(url, source, options)` -- GET ל-`r.jina.ai/{url}`
- משתמשת ב-`JINA_API_KEY` (כבר קיים)
- Headers: Authorization, X-No-Cache, X-Wait-For-Selector, X-Timeout: 35, X-Proxy-Url
- **עבור Homeless**: `Accept: text/html` + `X-Return-Format: html` (כדי לקבל HTML ולא markdown)
- **עבור Yad2/Madlan**: `Accept: text/markdown` (כמו היום)
- מחזירה `{ markdown, html }` -- HTML מלא להומלס, ריק לשאר
- Retry עם exponential backoff
- ולידציה של התוכן (שימוש ב-`validateScrapedContent` הקיים)

### 2. `supabase/functions/scout-yad2-jina/index.ts`
העתקה של `scout-yad2` עם:
- ייבוא `scrapeWithJina` במקום `scrapeWithRetry` + `getActiveFirecrawlKey`
- הסרת כל הלוגיקה של Firecrawl key rotation
- שרשור עצמי קורא ל-`scout-yad2-jina`
- אותו parser (`parseYad2Markdown`), save logic, retry/chain logic

### 3. `supabase/functions/scout-madlan-jina/index.ts`
העתקה של `scout-madlan` עם אותם שינויים:
- `scrapeWithJina` במקום Firecrawl
- שרשור ל-`scout-madlan-jina`

### 4. `supabase/functions/scout-homeless-jina/index.ts`
העתקה של `scout-homeless` עם:
- `scrapeWithJina(url, 'homeless')` -- מקבל HTML חזרה מ-Jina
- אותו parser `parseHomelessHtml` עובד על ה-HTML שחוזר
- Fallback ל-`parseHomelessMarkdown` אם ה-HTML ריק

### 5. `supabase/functions/trigger-scout-pages-jina/index.ts`
העתקה של `trigger-scout-pages` עם:
- `targetFunction = scout-{source}-jina` במקום `scout-{source}`
- תמיכה בכל 3 המקורות (yad2, madlan, homeless)

### 6. `supabase/functions/trigger-scout-all-jina/index.ts`
העתקה של `trigger-scout-all` עם:
- Kill switch: `process_scans_jina`
- קריאה ל-`trigger-scout-pages-jina`

## קבצים שיערכו (2)

### `src/components/scout/ChecksDashboard.tsx`
- הוספת `process_scans_jina` לרשימת הדגלים
- הוספת ProcessCard חדש **"סריקות 2 (Jina)"** עם:
  - אייקון Search בצבע teal
  - Kill switch, מטריקות, היסטוריה

### `supabase/config.toml`
- הוספת 5 פונקציות חדשות עם `verify_jwt = false`

## Migration
```sql
INSERT INTO feature_flags (name, is_enabled, description)
VALUES ('process_scans_jina', true, 'Kill switch for Jina-based property scanning')
ON CONFLICT (name) DO NOTHING;
```

## פרטים טכניים

### scrapeWithJina -- הפרדה לפי מקור

```text
function scrapeWithJina(url, source, options):
  headers = {
    Authorization: Bearer JINA_API_KEY,
    X-No-Cache: true,
    X-Wait-For-Selector: body,
    X-Timeout: 35,
    X-Proxy-Url: premium.residential-proxy.io,
  }

  if source === 'homeless':
    headers.Accept = 'text/html'
    headers['X-Return-Format'] = 'html'
    --> returns { markdown: '', html: responseBody }
  else:
    headers.Accept = 'text/markdown'
    --> returns { markdown: responseBody, html: '' }
```

### שרשור עצמי -- שינוי שם הפונקציה

```text
-- scout-yad2 המקורי:
fetch(`${supabaseUrl}/functions/v1/scout-yad2`, ...)

-- scout-yad2-jina:
fetch(`${supabaseUrl}/functions/v1/scout-yad2-jina`, ...)
```

### trigger-scout-pages-jina -- מיפוי פונקציות

```text
source='yad2'     --> scout-yad2-jina
source='madlan'   --> scout-madlan-jina
source='homeless' --> scout-homeless-jina
```

### השפעה על הקוד הקיים
- אפס שינויים בפונקציות המקוריות
- אפס שינויים בפרסרים
- אפס שינויים ב-shared utilities

## בדיקה אחרי פריסה
אפעיל את `trigger-scout-all-jina` ואבדוק בלוגים שהכל עובד תקין לפני שאתה מנסה.
