
# רוטציית מפתחות Firecrawl - מעבר אוטומטי בין חשבונות

## הרעיון
כשחשבון Firecrawl אחד מגיע ללימיט (שגיאה 402 או 429), המערכת תעבור אוטומטית למפתח הבא ברשימה. אתה תוכל להוסיף כמה מפתחות שתרצה.

## איך זה עובד

1. טבלה חדשה `firecrawl_api_keys` תשמור את כל המפתחות עם סטטוס (active/exhausted) ותאריך אחרון שנחסם
2. הפונקציה המשותפת `scrapeWithRetry` תשתנה - במקום לקבל מפתח בודד, היא תבחר אוטומטית מפתח פעיל מהטבלה
3. כשמפתח מקבל שגיאת לימיט (402/429), הוא מסומן כ-"exhausted" והמערכת עוברת למפתח הבא
4. מפתחות שנחסמו מתאפסים אוטומטית אחרי 24 שעות (הלימיט של Firecrawl מתחדש חודשית/יומית)

## שינויים

### 1. טבלת `firecrawl_api_keys` (מיגרציה)
- `id` - מזהה ייחודי
- `label` - שם תיאורי (לדוגמה "חשבון ראשי", "חשבון גיבוי")
- `api_key` - המפתח עצמו (מוצפן)
- `status` - active / exhausted
- `priority` - סדר עדיפות (1 = ראשון)
- `exhausted_at` - מתי נחסם (לאיפוס אוטומטי)
- `created_at`

### 2. שינוי `supabase/functions/_shared/scraping.ts`
- פונקציה חדשה `getActiveFirecrawlKey(supabase)` - שולפת את המפתח הפעיל בעדיפות הגבוהה ביותר, מאפסת מפתחות שעבר להם 24 שעות מהחסימה
- פונקציה חדשה `markKeyExhausted(supabase, keyId)` - מסמנת מפתח כנוצל
- שינוי `scrapeWithRetry` - כשמגיע status 402 או 429, מסמן את המפתח הנוכחי ומנסה עם הבא

### 3. עדכון כל Edge Functions שמשתמשות ב-Firecrawl
הפונקציות הבאות ישתנו להשתמש ב-`getActiveFirecrawlKey` במקום `Deno.env.get('FIRECRAWL_API_KEY')`:
- `scout-yad2`
- `scout-madlan`
- `scout-homeless`
- `check-property-availability`
- `backfill-property-data`
- `scout-project`
- `reclassify-broker`
- `import-streets`
- `check-seo-rendered`

המפתח הנוכחי מה-connector ישאר כברירת מחדל (fallback) אם הטבלה ריקה.

### 4. ממשק ניהול (אופציונלי - שלב שני)
דף הגדרות שמאפשר להוסיף/להסיר מפתחות ולראות את הסטטוס של כל אחד.

## פירוט טכני

### מיגרציית SQL
```text
CREATE TABLE firecrawl_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted')),
  priority INTEGER NOT NULL DEFAULT 1,
  exhausted_at TIMESTAMPTZ,
  total_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: only service role access (edge functions)
ALTER TABLE firecrawl_api_keys ENABLE ROW LEVEL SECURITY;
```

### לוגיקת `getActiveFirecrawlKey`
```text
1. Reset keys where exhausted_at < now() - 24 hours
2. SELECT api_key, id FROM firecrawl_api_keys
   WHERE status = 'active'
   ORDER BY priority ASC
   LIMIT 1
3. If no key found, fall back to Deno.env.get('FIRECRAWL_API_KEY')
```

### לוגיקת `scrapeWithRetry` (שינוי)
```text
Current: receives firecrawlApiKey as parameter
New: receives supabase client, gets key automatically
On 402/429 response:
  1. Mark current key as exhausted
  2. Get next active key
  3. Retry with new key
  4. If no more keys, return null (all exhausted)
```

### קבצים לעריכה
- מיגרציית SQL חדשה (טבלת `firecrawl_api_keys`)
- `supabase/functions/_shared/scraping.ts` (פונקציות חדשות + שינוי `scrapeWithRetry`)
- כל 9 ה-Edge Functions שמשתמשות ב-Firecrawl (שינוי signature)
