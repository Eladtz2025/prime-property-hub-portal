
# ניסוי Jina v2 - העתקת המערכת המקורית

## הגישה
העתקה מדויקת של שתי הפונקציות המקוריות (`check-property-availability` ו-`trigger-availability-check`) עם החלפת Firecrawl ב-Jina. אותו flow, אותה לוגיקת זיהוי, אותם עדכוני DB.

## מה ישתנה

### קובץ חדש: `supabase/functions/check-property-availability-jina/index.ts`
- העתקה מלאה של `check-property-availability/index.ts`
- הפונקציה `checkWithFirecrawl` תוחלף ב-`checkWithJina`:
  - במקום POST ל-Firecrawl API, שליחת GET ל-`https://r.jina.ai/{url}`
  - Headers: `X-No-Cache: true`, `X-Wait-For-Selector: body`, `X-Timeout: 30`, `X-Locale: he-IL`, `Accept: text/markdown`
  - שימוש ב-`JINA_API_KEY` מהסודות (כבר מוגדר) עבור Bearer auth
  - אין צורך ברוטציית מפתחות או proxy settings
- אותה לוגיקת זיהוי: `isListingRemoved`, `isMadlanHomepage`
- אותם עדכוני DB: `availability_checked_at`, `availability_check_count`, `is_active`, `status`
- אותו run_id ו-`append_run_detail`

### קובץ חדש: `supabase/functions/trigger-availability-check-jina/index.ts`
- העתקה מלאה של `trigger-availability-check/index.ts`
- ההבדל היחיד: קריאה ל-`check-property-availability-jina` במקום `check-property-availability`
- אותו flow: lock check, batching, self-chaining, daily limit, settings

### עדכון: `supabase/config.toml`
- הוספת שתי הפונקציות החדשות עם `verify_jwt = false`

## מה לא ישתנה
- `check-property-availability` - נשאר כמו שהוא
- `trigger-availability-check` - נשאר כמו שהוא
- `_shared/availability-indicators.ts` - נשאר כמו שהוא
- טבלאות DB - אותן טבלאות בדיוק (`availability_check_runs`, `scouted_properties`)

## איך תריץ את הניסוי
תפעיל את `trigger-availability-check-jina` (ידנית או curl) והוא יעבוד בדיוק כמו המקורי - רק עם Jina במקום Firecrawl. תוכל לראות את התוצאות באותם מקומות.

## פרטים טכניים

### ההבדל בין Firecrawl ל-Jina בפועל

```text
Firecrawl:
  POST https://api.firecrawl.dev/v1/scrape
  Authorization: Bearer {FIRECRAWL_KEY}
  Body: { url, formats: ['markdown'], proxy: 'stealth', ... }
  Response: { data: { markdown: "..." } }

Jina:
  GET https://r.jina.ai/{url}
  Authorization: Bearer {JINA_API_KEY}
  Accept: text/markdown
  X-No-Cache: true
  X-Wait-For-Selector: body
  X-Timeout: 30
  Response: plain text markdown
```

### Rate limit handling
- Firecrawl: רוטציית מפתחות מורכבת (402/429)
- Jina: פשוט retry. אם status 429 - ממתינים ומנסים שוב. בלי רוטציה

### הבדלי retry
- הלוגיקה של `maxRetries` ו-`retryDelayMs` נשארת זהה
- במקום `rateLimited` flag שמפעיל רוטציית מפתחות, פשוט retry רגיל

### מדלן skeleton detection
- תוספת קטנה: אם source=madlan ו-content.length < 1000, מסומן כ-`madlan_skeleton` (retryable) במקום `content_ok`
