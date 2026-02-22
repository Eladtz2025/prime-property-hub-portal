
# תיקון Madlan בכל 3 מערכות Jina — הושלם ✅

## קבצים ששונו

| # | קובץ | מה שונה | למה |
|---|-------|---------|-----|
| 1 | `_shared/madlan-observability.ts` | **חדש** — shared helper: `classifyMadlanContent`, `logMadlanScrapeResult`, `MADLAN_BLOCK_PHRASES` | TASK F: observability ללא PII |
| 2 | `scout-madlan-jina/index.ts` | `X-Wait-For-Selector` → `a[href^="/listings/"]`, `isMadlanBlocked` משודרג, structured log | TASK B: selector מדויק + חסימות |
| 3 | `_shared/scraping.ts` | Madlan validation: דרישת `/listings/` רק בדפי רשימה, price/rooms בדפי מודעה | TASK C: לא לשבור backfill/availability |
| 4 | `backfill-property-data-jina/index.ts` | Madlan cached-first (ללא X-No-Cache), blocked → `failed` + reason (לא סטטוס חדש) | TASK D: לא לתקוע נכסים |
| 5 | `check-property-availability-jina/index.ts` | blocked=retryable (לא inactive), sightings fallback עם `last_seen_at` | TASK E: למנוע false inactive |

## 4 התנאים — עמידה

1. ✅ **retryable_blocked**: לא הוספתי סטטוס חדש. משתמש ב-`failed` + reason קיים → נכסים חוזרים לתור
2. ✅ **validateScrapedContent**: `/listings/` נדרש רק כש-URL מכיל `/for-rent/` או `/for-sale/`. דפי מודעה (backfill/availability) משתמשים בבדיקות מחיר/חדרים
3. ✅ **last_seen_at**: אומת — העמודה קיימת ב-DB ו-`saveProperty` מעדכן אותה. Availability משתמש בה כ-fallback
4. ✅ **Observability**: לוגים מובנים (JSON) עם url + content_length + classification בלבד, ללא raw snippets/PII

## צעדי בדיקה

1. **Scout**: הרץ config של Madlan (Scans 2). בלוגים חפש `madlan_obs` — צפה ל-classification `ok` או `blocked`/`skeleton`
2. **Backfill**: הרץ backfill עם `source_filter: 'madlan'`. ודא שנכסים חסומים מקבלים `backfill_status: 'failed'` (לא סטטוס חדש)
3. **Availability**: הרץ availability על נכסי Madlan. ודא שחסימות לא מסמנות inactive. חפש `recently_seen` או `needs_manual_review` בלוגים
4. **Yad2/Homeless**: הרץ scout/backfill — ודא אפס שינויים בהתנהגות
