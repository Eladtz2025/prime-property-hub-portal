

# חיבור שדה wait_for_ms ל-X-Timeout בפונקציות Jina

## מה משתנה

בכל 3 פונקציות ה-Jina (homeless, yad2, madlan), הערך `X-Timeout: '30'` קבוע בקוד. השינוי יגרום לפונקציית הסריקה לקבל פרמטר `timeoutSeconds` אופציונלי, ואם הקונפיגורציה מכילה `wait_for_ms` — הוא יומר לשניות וישמש כ-`X-Timeout`.

## לוגיקה

```text
config.wait_for_ms = 15000  -->  X-Timeout: '15'
config.wait_for_ms = null   -->  X-Timeout: '30' (ברירת מחדל)
```

## שינויים בקבצים

### 1. `supabase/functions/scout-homeless-jina/index.ts`
- הוספת פרמטר `timeoutSeconds` לפונקציה `scrapeHomelessWithJina`
- שימוש בו ב-header של `X-Timeout` (ברירת מחדל: 30)
- העברת `config.wait_for_ms` מהקריאה בשורה 109

### 2. `supabase/functions/scout-yad2-jina/index.ts`
- הוספת פרמטר `timeoutSeconds` לפונקציה `scrapeYad2WithJina`
- שימוש בו ב-header של `X-Timeout` (ברירת מחדל: 30)
- העברת `config.wait_for_ms` מהקריאה

### 3. `supabase/functions/scout-madlan-jina/index.ts`
- הוספת פרמטר `timeoutSeconds` לפונקציה `scrapeMadlanWithJina`
- שימוש בו ב-header של `X-Timeout` (ברירת מחדל: 30)
- העברת `config.wait_for_ms` מהקריאה

### דוגמה לשינוי (זהה ב-3 הפונקציות)

**לפני:**
```text
async function scrapeHomelessWithJina(url, maxRetries = 2)
  ...
  'X-Timeout': '30',
```

**אחרי:**
```text
async function scrapeHomelessWithJina(url, maxRetries = 2, timeoutSeconds = 30)
  ...
  'X-Timeout': String(timeoutSeconds),
```

**בקריאה:**
```text
const timeoutSec = config.wait_for_ms ? Math.round(config.wait_for_ms / 1000) : 30;
const scrapeResult = await scrapeHomelessWithJina(url, MAX_RETRIES, timeoutSec);
```

### פריסה
פריסה מחדש של 3 פונקציות: `scout-homeless-jina`, `scout-yad2-jina`, `scout-madlan-jina`

