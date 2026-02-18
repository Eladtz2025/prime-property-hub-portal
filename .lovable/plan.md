
# הסרת JINA_API_KEY מכל המערכת + איפוס נכסים שנכשלו

## ✅ הושלם

### 1. הוסרו כל הפניות ל-JINA_API_KEY מ-3 קבצים:
- `supabase/functions/_shared/scraping-jina.ts`
- `supabase/functions/check-property-availability-jina/index.ts`
- `supabase/functions/backfill-property-data-jina/index.ts`

### 2. איפוס נכסים שנכשלו (SQL Migration)
~1,903 נכסים עם `jina_failed_after_retries` או `rate_limited` אופסו לתור הבדיקות.

### 3. Deploy
כל 5 הפונקציות נפרסו מחדש: scout-yad2-jina, scout-madlan-jina, scout-homeless-jina, check-property-availability-jina, backfill-property-data-jina
