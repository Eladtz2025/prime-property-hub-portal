

## הסרת מערכות Firecrawl (Legacy) והעברה ל-To Delete

### מה מסומן להסרה (לפי התמונה)
3 כרטיסים עם X:
1. **סריקות** (Legacy Firecrawl) — כולל edge functions ו-UI card
2. **בדיקת זמינות** (Legacy Firecrawl) — כולל edge functions ו-UI card
3. **השלמת נתונים** (Legacy Firecrawl) — כולל edge functions, hooks, ו-UI card

### מה נשאר ופועל (לא לגעת)
- סריקות 2 (Jina), בדיקת זמינות 2 (Jina), כפילויות, התאמות, השלמת נתונים 2 (Jina)
- `scout-project` (לא Firecrawl-based scanner — זה project scanning)
- `reclassify-broker`, `check-seo-rendered` (כלים עצמאיים)

---

### חלק 1: העברת Edge Functions לתיקיית To Delete

**Edge Functions להעברה ל-`supabase/functions/_to_delete/`:**
- `scout-yad2/` (Firecrawl scanner)
- `scout-madlan/` (Firecrawl scanner)
- `scout-homeless/` (Firecrawl scanner)
- `trigger-scout-all/` (Firecrawl trigger)
- `trigger-scout-pages/` (Firecrawl trigger)
- `check-property-availability/` (Firecrawl availability)
- `trigger-availability-check/` (Firecrawl availability trigger)
- `backfill-property-data/` (Firecrawl backfill)

**Shared files להעברה:**
- `_shared/firecrawl-keys.ts` → `_to_delete/`
- `_shared/scraping.ts` — **לא ניתן להעביר!** כי Jina functions (`scout-yad2-jina`, `scout-madlan-jina`, `scout-homeless-jina`, `scraping-jina.ts`) מייבאות ממנו `corsHeaders` ו-`validateScrapedContent`. צריך להשאיר את הקובץ אבל **להסיר** את `scrapeWithRetry` (שתלוי ב-Firecrawl) ואת כל ה-imports/references ל-firecrawl-keys.

### חלק 2: ניקוי Firecrawl מקבצים משותפים

**`supabase/functions/_shared/scraping.ts`:**
- להסיר את פונקציית `scrapeWithRetry` (שורות ~120-380 — תלויה ב-firecrawl API)
- להשאיר: `corsHeaders`, `validateScrapedContent`, `userAgents`

**`supabase/functions/_shared/scraping-jina.ts`:**
- להחליף comment "Replaces Firecrawl's scrapeWithRetry" → תיאור ניטרלי

**`supabase/functions/_shared/broker-detection.ts`:**
- להחליף comment "Deep Broker Detection (from Firecrawl markdown)" → "Deep Broker Detection (from scraped markdown)"

**`supabase/functions/_shared/settings.ts`:**
- להסיר שדות `firecrawl_max_retries`, `firecrawl_retry_delay_ms`, `use_firecrawl` מהגדרות ה-availability defaults

**`supabase/functions/scout-project/index.ts` ו-`reclassify-broker/index.ts` ו-`check-seo-rendered/index.ts`:**
- אלה עדיין משתמשים ב-`firecrawl-keys.ts`. צריך להעתיק את הלוגיקה הרלוונטית inline אליהם, או ליצור `_shared/firecrawl-keys.ts` חדש מצומצם. מכיוון שאלה 3 functions שעדיין צריכות Firecrawl API key, **אשאיר את `firecrawl-keys.ts` במקום** ואעביר רק את ה-legacy scanner functions.

**עדכון:** לאור הממצא ש-`scout-project`, `reclassify-broker`, `check-seo-rendered` עדיין צריכים `firecrawl-keys.ts` — הקובץ **לא יועבר** ל-To Delete. רק ה-8 edge functions שמוזכרים למעלה.

### חלק 3: ניקוי UI

**`src/components/scout/ChecksDashboard.tsx`:**
- הסרת 3 כרטיסי ProcessCard:
  - "סריקות" (שורות ~449-469)
  - "בדיקת זמינות" (שורות ~506-547)
  - "השלמת נתונים" (שורות ~669-707)
- הסרת queries/mutations קשורים:
  - `lastScanRun` query (שורות 213-221)
  - `triggerAvailability` mutation (שורות 263-276)
  - `stopAvailability` mutation (שורות 278-301)
  - `isScanRunning`, `isAvailRunning` variables
- הסרת imports ל-`useBackfillProgress` (legacy)
- הסרת `backfill` variable
- ניקוי Firecrawl מ-description texts בכרטיסים שנשארים
- הסרת Firecrawl-related setting labels (`firecrawl_max_retries`, `firecrawl_retry_delay_ms`)

**`src/hooks/useBackfillProgress.ts`:**
- להעביר ל-`src/_to_delete/` (ה-hook שמפעיל `backfill-property-data`)

**`src/hooks/useScoutSettings.ts`:**
- להסיר `use_firecrawl`, `firecrawl_max_retries`, `firecrawl_retry_delay_ms` מהטיפוס ומה-defaults

**`src/components/scout/checks/BackfillStatus.tsx`:**
- להעביר ל-`src/_to_delete/` (רכיב UI של backfill legacy)

**`src/components/scout/availability/AvailabilityActions.tsx`:**
- להסיר reference ל-`trigger-availability-check` (legacy) — זה רכיב שמפעיל את ה-legacy. לבדוק אם משמש עוד מקומות; אם לא — להעביר ל-to_delete

**`src/components/scout/checks/AvailabilityHistorySection.tsx`:**
- להסיר label `firecrawl_failed_after_retries` מה-reason mapping

### חלק 4: config.toml

הסרת הערכים:
```
[functions.check-property-availability]
[functions.trigger-scout-all]
[functions.backfill-property-data]
```
(ו-scout-yad2, scout-madlan, scout-homeless, trigger-scout-pages, trigger-availability-check אם קיימים)

### חלק 5: ScoutedPropertiesTable

- `useBackfillProgress` import נמצא שם. צריך להסיר את ה-import והשימוש (שורה 897). אם ה-backfill.start/stop משמשים ב-UI — להחליף ל-`useBackfillProgressJina` או להסיר.

---

### סיכום שינויים

| פעולה | כמות |
|-------|------|
| Edge Functions → `_to_delete/` | 8 תיקיות |
| UI components → `_to_delete/` | 2 קבצים |
| Hooks → `_to_delete/` | 1 קובץ |
| קבצים לעריכה (ניקוי Firecrawl refs) | ~8 קבצים |
| config.toml entries להסרה | ~5 entries |

