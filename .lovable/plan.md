

# תיקון Jina - מעבר למצב חופשי (ללא API)

## הבעיה
הקוד הנוכחי שולח `Authorization: Bearer ${jinaKey}` לכל בקשה ל-Jina Reader, מה שמשתמש בקרדיטים בתשלום. כשנגמרו הקרדיטים, כל הבקשות מחזירות 402.

Jina Reader תומך בשימוש חופשי לחלוטין -- פשוט שולחים בקשה ל-`r.jina.ai/{url}` בלי header של Authorization. המגבלה היחידה: 20 בקשות לדקה (לפי IP).

## הפתרון

### 1. `supabase/functions/_shared/scraping-jina.ts`
- הסרת שורת ה-`Authorization` מה-headers
- הסרת הבדיקה שמפסיקה אם אין JINA_API_KEY
- אופציונלי: אם JINA_API_KEY קיים, להשתמש בו (לעדיפות גבוהה יותר), אבל אם לא -- לעבוד בלעדיו

### 2. `supabase/functions/check-property-availability-jina/index.ts`
- הסרת הדרישה ל-JINA_API_KEY (שורות 203-209 שמחזירות שגיאה אם אין מפתח)
- הסרת `Authorization` header מפונקציית `checkWithJina` (שורה 47)
- המשך העברת headers אחרים (X-No-Cache, X-Locale וכו')

### פירוט טכני

**scraping-jina.ts -- שינויים:**
```typescript
// לפני:
const jinaKey = Deno.env.get('JINA_API_KEY');
if (!jinaKey) {
  console.error('JINA_API_KEY not configured');
  return null;
}
// ...
headers: {
  'Authorization': `Bearer ${jinaKey}`,
  ...
}

// אחרי:
const jinaKey = Deno.env.get('JINA_API_KEY');
// ...
const headers: Record<string, string> = {
  'X-No-Cache': 'true',
  ...
};
// Use API key only if available (for higher priority)
if (jinaKey) {
  headers['Authorization'] = `Bearer ${jinaKey}`;
}
```

**check-property-availability-jina -- שינויים:**
- הסרת הבדיקה שמפסיקה את הפונקציה אם אין JINA_API_KEY
- שינוי `checkWithJina` שלא ידרוש `jinaApiKey` כפרמטר חובה
- הוספת Authorization רק אם המפתח קיים

### חשוב
- מגבלת rate limit של 20/דקה בלי מפתח. המערכת כבר עובדת עם batch size 2 ו-delay, אז זה אמור להספיק
- אם בעתיד תרצה לחזור למצב API (עם קרדיטים), פשוט תמלא את JINA_API_KEY והמערכת תשתמש בו אוטומטית

### קבצים שישתנו
- `supabase/functions/_shared/scraping-jina.ts`
- `supabase/functions/check-property-availability-jina/index.ts`

### Deploy
- `scout-yad2-jina`, `scout-madlan-jina`, `scout-homeless-jina`, `check-property-availability-jina`
