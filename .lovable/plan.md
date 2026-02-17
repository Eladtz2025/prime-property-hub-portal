

# הוספת כפתורי הפעלה/עצירה לסריקות Jina + הפרדת נתונים

## הבעיה
שתי בעיות בכרטיס "סריקות 2 (Jina)":
1. אין כפתורי "הפעל" ו"עצור" -- אי אפשר להריץ סריקה ידנית
2. הכרטיס מציג את אותם הנתונים כמו כרטיס הסריקות המקורי (שניהם קוראים מ-scout_runs בלי להבדיל)

## הפתרון

### 1. הוספת עמודת `scanner` לטבלת `scout_runs`
Migration חדש שמוסיף עמודה `scanner TEXT DEFAULT 'firecrawl'` כדי להבדיל בין ריצות Firecrawl לריצות Jina.

### 2. עדכון `trigger-scout-pages-jina`
בעת יצירת ריצה חדשה ב-`scout_runs`, הוספת `scanner: 'jina'` לשורה.

### 3. הוספת mutations ב-ChecksDashboard
- `triggerScansJina` -- קורא ל-`trigger-scout-all-jina` (fire-and-forget, כמו שהסריקה הרגילה עובדת דרך cron)
- `stopScansJina` -- מעדכן `scout_runs` בסטטוס `stopped` עבור ריצות Jina פעילות

### 4. הפרדת שאילתות נתונים
- שאילתה חדשה `scan-last-run-jina` שמסננת `scanner = 'jina'`
- השאילתה המקורית `scan-last-run` תסנן `scanner = 'firecrawl'` (או NULL לתאימות אחורה)

### 5. חיבור הכרטיס
כרטיס Jina יקבל:
- `onRun` -> `triggerScansJina.mutate()`
- `onStop` -> `stopScansJina.mutate()`
- נתונים מ-`lastScanRunJina` (לא מ-`lastScanRun`)

## פרטים טכניים

### Migration
```sql
ALTER TABLE scout_runs ADD COLUMN IF NOT EXISTS scanner TEXT DEFAULT 'firecrawl';
```

### שינוי ב-trigger-scout-pages-jina
בשורת ה-INSERT ל-scout_runs, הוספת שדה `scanner: 'jina'`.

### שאילתות חדשות ב-ChecksDashboard
- `lastScanRunJina`: אותה שאילתה כמו `lastScanRun` עם פילטר `.eq('scanner', 'jina')`
- `lastScanRun` המקורי: הוספת `.or('scanner.is.null,scanner.eq.firecrawl')` לתאימות אחורה

### Mutations חדשים
- `triggerScansJina`: `supabase.functions.invoke('trigger-scout-all-jina')`
- `stopScansJina`: עדכון `scout_runs` עם `status: 'stopped'` לריצות עם `scanner = 'jina'` ו-`status = 'running'`

### קבצים שישתנו
1. Migration חדש (עמודת scanner)
2. `supabase/functions/trigger-scout-pages-jina/index.ts` (הוספת scanner: 'jina' ב-INSERT)
3. `src/components/scout/ChecksDashboard.tsx` (שאילתות, mutations, חיבור לכרטיס)
4. `src/integrations/supabase/types.ts` (עדכון טיפוסים)

