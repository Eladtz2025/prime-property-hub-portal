

# תיקון: נכסים חדשים לא נכנסים להשלמת נתונים (Jina)

## הבעיה

נכסים חדשים שנסרקים נשמרים עם `backfill_status = 'pending'`, אבל פונקציית השלמת הנתונים מחפשת רק `backfill_status IS NULL` או `backfill_status = 'failed'` — ולכן מפספסת אותם לחלוטין.

## הפתרון

להוסיף `backfill_status.eq.pending` לפילטר בפונקציית ה-backfill.

## קבצים לשינוי

### `supabase/functions/backfill-property-data-jina/index.ts`

3 מקומות שבהם מופיע הפילטר (שורות ~247, ~306, ~852):

**לפני:**
```
.or('backfill_status.is.null,backfill_status.eq.failed')
```

**אחרי:**
```
.or('backfill_status.is.null,backfill_status.eq.pending,backfill_status.eq.failed')
```

### `supabase/functions/backfill-property-data/index.ts` (Firecrawl — אותו תיקון לעקביות)

אותו שינוי ב-3 מקומות מקבילים (~292, ~357, ועוד).

## פריסה

פריסה מחדש של `backfill-property-data-jina` (ו-`backfill-property-data` אם רוצים עקביות).

