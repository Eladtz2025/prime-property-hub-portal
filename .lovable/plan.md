
# הסרת JINA_API_KEY מכל המערכת + איפוס נכסים שנכשלו

## מצב נוכחי
- יש **1,882 נכסים** עם `jina_failed_after_retries` ו-**21** עם `rate_limited` -- כולם נכשלו בגלל שגיאת 402 (קרדיטים) אבל סומנו כאילו נבדקו
- הקוד עדיין מכיל `JINA_API_KEY` ב-3 קבצים, חלקו אופציונלי וחלקו חובה

## מה יתוקן

### 1. איפוס נכסים שלא באמת נבדקו (SQL Migration)
```sql
UPDATE scouted_properties
SET 
  availability_checked_at = NULL,
  availability_check_reason = NULL,
  availability_check_count = 0
WHERE availability_check_reason IN ('jina_failed_after_retries', 'rate_limited')
  AND is_active = true;
```
זה יחזיר **1,903 נכסים** לתור הבדיקות כדי שייבדקו מחדש כראוי.

### 2. הסרה מלאה של JINA_API_KEY מ-3 קבצים

**קובץ 1: `supabase/functions/_shared/scraping-jina.ts`**
- הסרת `const jinaKey = Deno.env.get('JINA_API_KEY')`
- הסרת הבלוק `if (jinaKey) { headers['Authorization'] = ... }`
- הסרת ההתייחסות ל-`auth: yes/free` מהלוג

**קובץ 2: `supabase/functions/check-property-availability-jina/index.ts`**
- הסרת `const jinaApiKey = Deno.env.get('JINA_API_KEY')`
- הסרת הבלוק `if (jinaApiKey) { headers['Authorization'] = ... }`

**קובץ 3: `supabase/functions/backfill-property-data-jina/index.ts`**
- הסרת הבדיקה שעוצרת את הפונקציה אם אין מפתח (שורות 114-118)
- הסרת `'Authorization': \`Bearer ${jinaApiKey}\`` מה-headers של הבקשה (שורה 441)
- הסרת `'X-Proxy-Url': 'https://premium.residential-proxy.io'` (פיצ'ר בתשלום)

### 3. Deploy
כל הפונקציות שמשתמשות ב-scraping-jina.ts:
- `scout-yad2-jina`
- `scout-madlan-jina`
- `scout-homeless-jina`
- `check-property-availability-jina`
- `backfill-property-data-jina`

### פירוט טכני

**scraping-jina.ts -- לפני:**
```typescript
const jinaKey = Deno.env.get('JINA_API_KEY');
// ...
if (jinaKey) {
  headers['Authorization'] = `Bearer ${jinaKey}`;
}
```

**scraping-jina.ts -- אחרי:**
```typescript
// No API key - using Jina free tier (20 req/min)
```

**backfill-property-data-jina -- לפני:**
```typescript
const jinaApiKey = Deno.env.get('JINA_API_KEY');
if (!jinaApiKey) {
  throw new Error('JINA_API_KEY not configured');
}
// ...
headers: {
  'Authorization': `Bearer ${jinaApiKey}`,
  'X-Proxy-Url': 'https://premium.residential-proxy.io',
  ...
}
```

**backfill-property-data-jina -- אחרי:**
```typescript
// No API key needed - using Jina free tier
// ...
headers: {
  'Accept': 'text/markdown',
  'X-No-Cache': 'true',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
}
```

### קבצים שישתנו
- `supabase/functions/_shared/scraping-jina.ts`
- `supabase/functions/check-property-availability-jina/index.ts`
- `supabase/functions/backfill-property-data-jina/index.ts`
- SQL migration לאיפוס הנכסים
