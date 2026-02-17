

# הוספת כפתור כיבוי לזמינות Jina + כרטיסיית השלמת נתונים Jina

## 1. כפתור כיבוי (Toggle) לכרטיסיית בדיקת זמינות Jina

כרגע לכרטיסייה של Jina אין Switch כיבוי/הפעלה. צריך:

- להוסיף רשומה חדשה בטבלת `feature_flags` בשם `process_availability_jina`
- לשלוף את הדגל הזה בקומפוננט `ChecksDashboard`
- לחבר את ה-Switch בכרטיסייה של Jina

**קובץ:** `src/components/scout/ChecksDashboard.tsx`
- הוספת `process_availability_jina` לרשימת הדגלים בשאילתת `process-flags`
- הוספת `enabled` ו-`onToggleEnabled` לכרטיסיית Jina

## 2. כרטיסיית השלמת נתונים (Jina)

### Edge Function חדשה: `backfill-property-data-jina`

העתקה של `backfill-property-data` עם השינויים הבאים:
- החלפת קריאת Firecrawl API (`api.firecrawl.dev/v1/scrape`) בקריאת Jina (`r.jina.ai/URL`)
- הסרת לוגיקת רוטציית מפתחות Firecrawl (שימוש ב-`JINA_API_KEY` בלבד)
- שם task שונה: `data_completion_jina` (כדי לא להתנגש עם ה-backfill הרגיל)
- אותו קוד חילוץ נתונים, features, כתובות, broker detection -- בדיוק כמו המקור

### Hook חדש: `useBackfillProgressJina`

העתקה של `useBackfillProgress` עם `task_name = 'data_completion_jina'` וקריאה ל-`backfill-property-data-jina`.

### כרטיסייה בדשבורד

הוספת `ProcessCard` חדש בשם "השלמת נתונים 2 (Jina)" עם:
- אייקון Database בצבע teal (כמו הזמינות של Jina)
- כפתורי הפעל/עצור
- מטריקות (נותרו, הצלחות, כשלונות)
- תיאור לוגיקה בהגדרות

## פרטים טכניים

### Migration (feature flag):

```sql
INSERT INTO feature_flags (name, is_enabled, description)
VALUES ('process_availability_jina', true, 'Kill switch for Jina availability check')
ON CONFLICT (name) DO NOTHING;
```

### שינוי ב-Firecrawl -> Jina (בקובץ החדש):

```text
-- מקור (Firecrawl):
const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${firecrawlApiKey}`, ... },
  body: JSON.stringify({ url: prop.source_url, formats: ['markdown'], ... })
});
const scrapeData = await scrapeResponse.json();
const markdown = scrapeData.data?.markdown || '';

-- יעד (Jina):
const scrapeResponse = await fetch(`https://r.jina.ai/${prop.source_url}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jinaApiKey}`,
    'Accept': 'text/markdown',
    'X-No-Cache': 'true',
    'X-Wait-For-Selector': 'body',
    'X-Timeout': '35',
    'X-Proxy-Url': 'https://premium.residential-proxy.io',
  }
});
const markdown = await scrapeResponse.text();
```

### קבצים שישתנו/ייווצרו:

1. `supabase/functions/backfill-property-data-jina/index.ts` -- חדש (העתקה + Jina)
2. `src/hooks/useBackfillProgressJina.ts` -- חדש
3. `src/components/scout/ChecksDashboard.tsx` -- עריכה (toggle + כרטיסייה חדשה)
4. Migration -- הוספת feature flag

