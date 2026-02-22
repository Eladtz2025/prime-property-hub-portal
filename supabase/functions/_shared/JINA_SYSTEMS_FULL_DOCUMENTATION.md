# מסמך תיעוד מלא - מערכות Jina

> מסמך זה מכיל את **כל** המידע הנדרש לשחזור/הבנה של שלוש המערכות מבוססות Jina:
> 1. **סריקות 2 (Jina)** - סריקת נכסים מאתרי נדל"ן
> 2. **השלמת נתונים 2 (Jina)** - העשרת נכסים קיימים
> 3. **בדיקת זמינות 2 (Jina)** - בדיקה אם מודעות עדיין פעילות

---

## תוכן עניינים

1. [ארכיטקטורה כללית](#1-ארכיטקטורה-כללית)
2. [עקרונות יסוד](#2-עקרונות-יסוד)
3. [טבלאות DB](#3-טבלאות-db)
4. [סריקות 2 - קבצים וקוד](#4-סריקות-2---קבצים-וקוד)
5. [השלמת נתונים 2 - קבצים וקוד](#5-השלמת-נתונים-2---קבצים-וקוד)
6. [בדיקת זמינות 2 - קבצים וקוד](#6-בדיקת-זמינות-2---קבצים-וקוד)
7. [קבצי Shared - הלב של המערכת](#7-קבצי-shared---הלב-של-המערכת)
8. [Headers לכל פונקציה](#8-headers-לכל-פונקציה)
9. [תזמון ולוחות זמנים](#9-תזמון-ולוחות-זמנים)
10. [Kill Switches](#10-kill-switches)

---

## 1. ארכיטקטורה כללית

```
┌──────────────────────────────────────────────────────────────────┐
│                        CRON TRIGGERS                              │
│  23:00 → trigger-scout-all-jina                                   │
│  00:00 → backfill-property-data-jina (action: start)              │
│  05:00 → trigger-availability-check-jina                          │
└──────┬──────────────────────┬──────────────────────┬──────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│ סריקות 2     │   │ השלמת נתונים 2   │   │ בדיקת זמינות 2       │
│              │   │                  │   │                      │
│ trigger-     │   │ backfill-        │   │ trigger-availability-│
│ scout-all-   │   │ property-data-   │   │ check-jina           │
│ jina         │   │ jina             │   │                      │
│   │          │   │   │              │   │   │                  │
│   ▼          │   │   ▼              │   │   ▼                  │
│ trigger-     │   │ self-chain       │   │ check-property-      │
│ scout-pages- │   │ (action:continue)│   │ availability-jina    │
│ jina         │   │                  │   │                      │
│   │          │   └──────────────────┘   │   │                  │
│   ├─► scout-homeless-jina (parallel)    │   ▼                  │
│   ├─► scout-yad2-jina    (sequential)   │ self-chain           │
│   └─► scout-madlan-jina  (sequential)   │ (continue_run: true) │
└──────────────┘                          └──────────────────────┘
       │                      │                      │
       └──────────────────────┴──────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Shared Helpers    │
                    │                    │
                    │ • run-helpers.ts    │
                    │ • settings.ts       │
                    │ • process-flags.ts  │
                    │ • property-helpers  │
                    │ • url-builders.ts   │
                    │ • scraping.ts       │
                    │ • broker-detection  │
                    │ • availability-     │
                    │   indicators.ts     │
                    │ • neighborhood-     │
                    │   codes.ts          │
                    └────────────────────┘
```

**כל הקריאות ל-Jina הן ללא API Key (Free Tier).**
URL Pattern: `https://r.jina.ai/{target_url}`

---

## 2. עקרונות יסוד

### 2.1 Free Tier בלבד
- **אין JINA_API_KEY** — כל ה-Authorization headers הוסרו
- מגבלה: **20 requests/minute**
- עיכוב 3 שניות בין requests

### 2.2 Self-Chaining
פונקציות Edge מוגבלות ל-60 שניות. הפתרון:
- הפונקציה מעבדת batch קטן
- בסיום, קוראת **לעצמה** עם `action: 'continue'` או `continue_run: true`
- עוצרת כש-`schedule_end_time` עבר

### 2.3 Kill Switches
כל תהליך ניתן לכיבוי דרך טבלת `feature_flags`:
- `process_scans_jina` → סריקות
- `process_backfill_jina` → השלמת נתונים
- `process_availability` → בדיקת זמינות

### 2.4 Data Isolation
עמודת `scanner` בטבלת `scout_runs` מפרידה בין:
- `scanner: 'firecrawl'` (מערכת ישנה)
- `scanner: 'jina'` (מערכת חדשה)

---

## 3. טבלאות DB

### 3.1 scout_configs
```sql
-- הגדרות סריקה - כל config מייצג חיפוש ספציפי
id UUID PRIMARY KEY
name TEXT               -- "תל אביב שכירות - מדלן"
source TEXT             -- 'yad2' | 'madlan' | 'homeless'
property_type TEXT      -- 'rent' | 'sale' | 'both'
cities TEXT[]           -- ['תל אביב']
neighborhoods TEXT[]    -- ['צפון ישן', 'בבלי']
is_active BOOLEAN       -- האם פעיל
schedule_times TEXT[]    -- ['23:00', '07:00'] (שעות Israel Time)
max_pages INTEGER       -- מספר דפים לסרוק
start_page INTEGER      -- דף התחלה (מדלן: 2)
page_delay_seconds INT  -- עיכוב בין דפים
owner_type_filter TEXT  -- 'private_only' | 'all'
min_price, max_price INTEGER
min_rooms, max_rooms INTEGER
last_run_at TIMESTAMP
last_run_status TEXT
last_run_results JSONB
```

### 3.2 scout_runs
```sql
-- ריצה בודדת של סריקה
id UUID PRIMARY KEY
config_id UUID REFERENCES scout_configs
source TEXT             -- 'yad2' | 'madlan' | 'homeless'
status TEXT             -- 'running' | 'completed' | 'partial' | 'stopped' | 'failed'
scanner TEXT            -- 'firecrawl' | 'jina' ← *** הפרדת נתונים ***
properties_found INT
new_properties INT
page_stats JSONB        -- מערך של PageStat (ראה run-helpers.ts)
created_at, completed_at TIMESTAMP
```

### 3.3 scout_settings
```sql
-- הגדרות גלובליות per-category
category TEXT           -- 'scraping' | 'availability' | 'backfill' | 'matching' | 'duplicates'
setting_key TEXT        -- 'batch_size', 'daily_limit', etc.
setting_value JSONB     -- הערך
-- קומבינציה ייחודית: (category, setting_key)
```

**הגדרות availability חשובות:**
| Key | Default | תיאור |
|-----|---------|-------|
| batch_size | 25 | נכסים per batch |
| daily_limit | 1200 | מקסימום ביום |
| first_recheck_interval_days | 8 | ימים לפני בדיקה ראשונה |
| recurring_recheck_interval_days | 2 | ימים בין בדיקות חוזרות |
| per_property_timeout_ms | 25000 | timeout per property |
| schedule_end_time | "06:30" | עצירת self-chain |

**הגדרות backfill:**
| Key | Default | תיאור |
|-----|---------|-------|
| schedule_end_time | "02:30" | עצירת self-chain |

**הגדרות scraping:**
| Key | Default | תיאור |
|-----|---------|-------|
| yad2_pages | 7 | דפים ליד2 |
| madlan_pages | 4 | דפים למדלן |
| homeless_pages | 0 | דפים להומלס |

### 3.4 feature_flags
```sql
-- Kill switches
name TEXT UNIQUE        -- 'process_scans_jina', 'process_availability', etc.
is_enabled BOOLEAN      -- true/false
description TEXT
```

### 3.5 scouted_properties
```sql
-- הנכסים הנסרקים
id UUID PRIMARY KEY
source TEXT             -- 'yad2' | 'madlan' | 'homeless'
source_url TEXT         -- URL מקורי
source_id TEXT          -- מזהה מודעה (מנורמל)
title TEXT
address TEXT
neighborhood TEXT
city TEXT
rooms NUMERIC
price INTEGER
size INTEGER
floor INTEGER
features JSONB          -- { balcony, parking, elevator, mamad, ... }
is_private BOOLEAN      -- true=פרטי, false=מתווך, null=לא ידוע
is_active BOOLEAN       -- true=פעיל, false=הוסר
status TEXT             -- 'active' | 'inactive'
-- Backfill fields:
backfill_status TEXT    -- null | 'completed' | 'failed' | 'not_needed'
-- Availability fields:
availability_checked_at TIMESTAMP
availability_check_reason TEXT
availability_check_count INTEGER
created_at, updated_at TIMESTAMP
```

### 3.6 backfill_progress
```sql
-- מעקב task backfill
id UUID PRIMARY KEY
task_name TEXT          -- 'data_completion_jina'
status TEXT             -- 'running' | 'completed' | 'stopped' | 'failed'
total_items INTEGER
processed_items INTEGER
successful_items INTEGER
failed_items INTEGER
summary_data JSONB      -- סטטיסטיקות מצטברות + recent_items
started_at, completed_at, updated_at TIMESTAMP
error_message TEXT
```

### 3.7 availability_check_runs
```sql
-- ריצות בדיקת זמינות
id UUID PRIMARY KEY
status TEXT             -- 'running' | 'completed' | 'failed' | 'stopped'
is_manual BOOLEAN
properties_checked INTEGER
inactive_marked INTEGER
run_details JSONB       -- תוצאות מפורטות per-property
started_at, completed_at TIMESTAMP
error_message TEXT
```

### 3.8 debug_scrape_samples
```sql
-- דגימות debug
source TEXT UNIQUE      -- 'yad2' | 'madlan' | 'homeless'
url TEXT
markdown TEXT
html TEXT
properties_found INTEGER
```

### 3.9 street_neighborhoods (for homeless parser)
```sql
-- 1,245 רחובות בתל אביב עם שכונות
street_name TEXT
neighborhood TEXT
```

### 3.10 DB Functions (RPC)
```sql
-- Atomic increment for scout run stats
CREATE FUNCTION increment_scout_run_stats(p_run_id UUID, p_found INT, p_new INT)

-- Get properties needing availability check (excludes duplicate losers)
CREATE FUNCTION get_properties_needing_availability_check(
  p_first_recheck_days INT,
  p_recurring_recheck_days INT,
  p_min_days_before_check INT,
  p_fetch_limit INT
)

-- Append detail to availability run
CREATE FUNCTION append_run_detail(p_run_id UUID, p_detail JSONB)
```

---

## 4. סריקות 2 - קבצים וקוד

### 4.1 תרשים זרימה

```
trigger-scout-all-jina (Cron 23:00)
  │
  ├─ בדיקת kill switch: process_scans_jina
  ├─ שליפת scout_configs פעילים
  ├─ סינון לפי schedule_times (Israel Time)
  │
  └─ לכל config מתאים:
       │
       trigger-scout-pages-jina (config_id)
         │
         ├─ יצירת scout_run (scanner: 'jina')
         ├─ יצירת page_stats ראשוני
         │
         ├─ homeless → PARALLEL: כל דף ביחד (עם delay)
         ├─ yad2    → SEQUENTIAL: דף 1 → trigger דף 2 → ...
         └─ madlan  → SEQUENTIAL: דף 1 → trigger דף 2 → ...
```

### 4.2 קובץ: `trigger-scout-all-jina/index.ts`

**תפקיד:** Cron entry point - בודק אילו configs מתוזמנים לשעה הנוכחית ומפעיל אותם.

```typescript
// Kill switch
if (!await isProcessEnabled(supabase, 'scans_jina')) return;

// שליפת configs פעילים
const allConfigs = await supabase.from('scout_configs').select('*').eq('is_active', true);

// סינון לפי שעה נוכחית (Israel Time)
const israelTime = new Date().toLocaleTimeString('he-IL', {
  timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false
});
const configs = allConfigs.filter(c => c.schedule_times?.includes(israelTime));

// הפעלת כל config
for (const config of configs) {
  fetch(`${supabaseUrl}/functions/v1/trigger-scout-pages-jina`, {
    method: 'POST',
    body: JSON.stringify({ config_id: config.id })
  });
  await sleep(1500); // רווח בין triggers
}
```

### 4.3 קובץ: `trigger-scout-pages-jina/index.ts`

**תפקיד:** יוצר run ומפעיל את הדפים לפי מקור.

**לוגיקה מרכזית:**
- בודק שאין run פעיל לאותו config
- יוצר `scout_run` עם `scanner: 'jina'`
- **homeless** → parallel: כל הדפים ביחד, עם delay של 2 שניות בין דף לדף
- **yad2/madlan** → sequential: מפעיל רק דף 1, כל דף מפעיל את הבא

```typescript
const SOURCE_DELAYS = { yad2: 3000, madlan: 30000, homeless: 2000 };

// Sequential mode for madlan and yad2
if (source === 'madlan' || source === 'yad2') {
  await fetch(`${supabaseUrl}/functions/v1/scout-${source}-jina`, {
    body: JSON.stringify({ config_id, page: startPage, run_id: runId, max_pages, start_page })
  });
} else {
  // Parallel mode for homeless
  for (let page = startPage; page <= pagesToScan; page++) {
    await new Promise(r => setTimeout(r, (page - startPage) * delayMs));
    await fetch(`${supabaseUrl}/functions/v1/scout-${source}-jina`, {
      body: JSON.stringify({ config_id, page, run_id: runId, max_pages })
    });
  }
}
```

### 4.4 קובץ: `scout-homeless-jina/index.ts`

**תפקיד:** סורק דף בודד מהומלס. מבקש HTML (לא markdown) כי הפרסר משתמש ב-Cheerio.

**Headers:**
```typescript
headers: {
  'Accept': 'text/html',
  'X-Return-Format': 'html',
  'X-No-Cache': 'true',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '30',
  'X-Locale': 'he-IL',
}
```

**זרימה:**
1. בדיקת `isRunStopped`
2. בניית URL דרך `buildSinglePageUrl`
3. סריקה עם Jina (2 retries)
4. Validation עם `validateScrapedContent`
5. פרסור עם `parseHomelessHtml` (Cheerio)
6. שמירת נכסים עם `saveProperty`
7. עדכון `page_stats` ו-run stats
8. `checkAndFinalizeRun` (לבדיקה אם הריצה הסתיימה)

### 4.5 קובץ: `scout-yad2-jina/index.ts`

**תפקיד:** סורק דף בודד מיד2. סדרתי - כל דף מפעיל את הבא.

**Headers:**
```typescript
headers: {
  'Accept': 'text/markdown',
  'X-No-Cache': 'true',
  'X-Wait-For-Selector': 'a[href*="/realestate/item/"]',
  'X-Timeout': '30',
  'X-Proxy-Country': 'IL',
  'X-Locale': 'he-IL',
}
```

**לוגיקת שרשור (chainNextPage):**
- דף הצליח → המתנה 15 שניות → trigger דף הבא
- דף נכשל → המתנה 25 שניות → trigger דף הבא (recovery)
- כל הדפים סיימו → בדיקת blocked pages → retry (עד 2 פעמים)
- retry נכשל → finalize run

**handleRetryOrFinalize:** אחרי שכל הדפים סיימו, בודק אם יש דפים blocked שלא ניסו retry עדיין (retry_count < 2). אם כן, מפעיל אותם ברצף.

### 4.6 קובץ: `scout-madlan-jina/index.ts`

**תפקיד:** סורק דף בודד ממדלן. סדרתי עם recovery.

**Headers (אחרי הסרת cache):**
```typescript
headers: {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '30',
  'X-Locale': 'he-IL',
}
```

**זיהוי חסימה:**
```typescript
function isMadlanBlocked(content: string): boolean {
  return content.includes('סליחה על ההפרעה') || 
         content.includes('משהו בדפדפן שלך גרם לנו לחשוב') ||
         content.includes('error 403') ||
         content.length < 1000;
}
```

**לוגיקת שרשור:** זהה ליד2 - כל דף מפעיל את הבא, עם 15 שניות המתנה בין דפים ו-15 שניות recovery אחרי חסימה.

---

## 5. השלמת נתונים 2 - קבצים וקוד

### 5.1 תרשים זרימה

```
backfill-property-data-jina (Cron 00:00, action: 'start')
  │
  ├─ Kill switch: process_backfill_jina
  ├─ שליפת נכסים עם backfill_status = null/failed
  ├─ batch של 5 נכסים
  │
  └─ לכל נכס:
       ├─ Jina scrape (45s timeout)
       ├─ extractPropertyData (rooms, price, size, floor, neighborhood)
       ├─ extractFeatures (balcony, parking, elevator, mamad, ...)
       ├─ extractAddressFromPage (שדרוג כתובת)
       ├─ extractEntryDateInfo (תאריך כניסה)
       ├─ detectBrokerFromMarkdown (זיהוי מתווך)
       ├─ isBlacklistedLocation (סינון ערים)
       ├─ עדכון DB
       └─ 1.5s delay
  │
  └─ Self-chain (action: 'continue', task_id) if more items
```

### 5.2 קובץ: `backfill-property-data-jina/index.ts` (1,187 שורות)

**Actions:**
- `start` → יצירת task חדש, התחלת עיבוד
- `continue` → המשך task קיים (self-chain)
- `stop` → עצירת task
- `status` → בדיקת סטטוס

**Headers לסריקת נכס בודד:**
```typescript
headers: {
  'Accept': 'text/markdown',
  'X-No-Cache': 'true',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
}
```

**Timeout protection:** AbortController של 45 שניות per property.

**Blacklist locations (non-Tel Aviv):**
```typescript
const BLACKLIST_LOCATIONS = [
  { pattern: /נווה\s*כפיר/i, real_city: 'פתח תקווה' },
  { pattern: /צופים/i, real_city: 'צופים' },
  { pattern: /קיסריה/i, real_city: 'קיסריה' },
  // ... 25+ patterns
];
```

**שדות שמתעדכנים:**
- `rooms` (1-15)
- `price` (1,000-50,000,000)
- `size` (20-1000 מ"ר)
- `floor` (0-50)
- `city` (מתוך רשימה קבועה)
- `neighborhood` (מתוך רשימה קבועה)
- `address` (שדרוג עם מספר בית)
- `features` (12 מאפיינים)
- `is_private` (זיהוי מתווך)

**Self-chain:**
```typescript
if (hasMore && !endTimeReached) {
  await fetch(`${supabaseUrl}/functions/v1/backfill-property-data-jina`, {
    body: JSON.stringify({ action: 'continue', task_id: progressId })
  });
}
```

**Features extraction (12 מאפיינים):**
כל מאפיין משתמש ב-positive patterns ו-negative patterns:
- `balcony` — מרפסת
- `yard` — חצר/גינה
- `elevator` — מעלית
- `parking` — חניה
- `mamad` — ממ"ד
- `storage` — מחסן
- `roof` — גג
- `aircon` — מיזוג
- `renovated` — משופץ
- `furnished` — מרוהט
- `accessible` — נגיש לנכים
- `pets` — חיות מחמד

**Entry date extraction:**
- כניסה מיידית ("כניסה מיידית", "פנויה", "גמיש")
- תאריך ספציפי ("01/03/2026", "1 במרץ 2026")

**Address enrichment:**
- בדיקה אם הכתובת הקיימת חסרת מספר בית
- חילוץ כתובת מהדף (patterns שונים ליד2 ומדלן)
- validation: בדיקה שהכתובת לא מכילה שם מתווך
- התאמת רחוב: וידוא שהרחוב מהדף תואם לרחוב הקיים

---

## 6. בדיקת זמינות 2 - קבצים וקוד

### 6.1 תרשים זרימה

```
trigger-availability-check-jina (Cron 05:00)
  │
  ├─ Kill switch: process_availability
  ├─ Lock check (מניעת ריצות מקבילות)
  ├─ Daily limit check
  ├─ שליפת נכסים דרך RPC
  ├─ חלוקה ל-batches
  │
  └─ לכל batch (עד 3 batches):
       │
       check-property-availability-jina (property_ids[])
         │
         ├─ לכל נכס (סדרתי, 3s delay):
         │    ├─ Jina scrape
         │    ├─ CAPTCHA/skeleton detection (madlan)
         │    ├─ isListingRemoved (טקסט הסרה)
         │    ├─ isMadlanHomepage (redirect detection)
         │    └─ עדכון DB
         │
         └─ Return results
  │
  └─ Self-chain if more batches + daily quota remaining
```

### 6.2 קובץ: `trigger-availability-check-jina/index.ts`

**תפקיד:** Orchestrator - שולף נכסים, מחלק ל-batches, שולח לבדיקה.

**Lock mechanism:**
```typescript
// בדיקת ריצה קיימת ב-10 דקות אחרונות
const { data: runningCheck } = await supabase
  .from('availability_check_runs')
  .select('id, started_at, is_manual')
  .eq('status', 'running')
  .gt('started_at', tenMinutesAgo);
```

**Batch processing:**
- `MAX_BATCHES_PER_RUN = 3`
- `BATCH_TIMEOUT_MS = 110000` (110 שניות per batch)
- `delay_between_batches_ms` (מהגדרות)

**Self-chain:**
```typescript
const shouldSelfChain = !wasStopped && remainingBatches > 0 && 
                        remainingDailyQuota > 0 && !endTimeReached;
if (shouldSelfChain) {
  await sleep(10000);
  fetch(`${supabaseUrl}/functions/v1/trigger-availability-check-jina`, {
    body: JSON.stringify({ continue_run: true, manual: effectiveManual })
  });
}
```

### 6.3 קובץ: `check-property-availability-jina/index.ts`

**תפקיד:** בודק batch של נכסים - האם המודעות עדיין פעילות.

**Madlan - Two-phase strategy:**
```typescript
// Phase 1: cache (מהיר, בלי X-No-Cache)
// Phase 2: fresh+proxy (אם CAPTCHA, עם X-No-Cache + X-Proxy-Country: IL)
const phases = isMadlan 
  ? [{ noCache: false, label: 'cache' }, { noCache: true, label: 'fresh+proxy' }]
  : [{ noCache: true, label: 'standard' }];
```

**Headers (non-madlan):**
```typescript
headers: {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
  'X-No-Cache': 'true',
}
```

**Headers (madlan phase 2):**
```typescript
headers: {
  'Accept': 'text/markdown',
  'X-Wait-For-Selector': 'body',
  'X-Timeout': '35',
  'X-No-Cache': 'true',
  'X-Proxy-Country': 'IL',  // רק ב-phase 2
}
```

**Detection logic:**
- CAPTCHA/skeleton (< 1000 chars, "סליחה על ההפרעה") → retryable
- `isListingRemoved` → inactive (מודעה הוסרה)
- `isMadlanHomepage` → retryable (redirect לדף הבית)
- Rate limited (429) → retryable
- Content OK → active

**Retryable reasons (לא מסמנים inactive):**
```typescript
const retryableReasons = new Set([
  'per_property_timeout', 'jina_failed_after_retries', 'check_error',
  'short_content_keeping_active', 'rate_limited',
  'madlan_skeleton', 'madlan_captcha_blocked', 'madlan_homepage_redirect',
]);
```

---

## 7. קבצי Shared - הלב של המערכת

### 7.1 `_shared/run-helpers.ts`

**PageStat interface:**
```typescript
interface PageStat {
  page: number;
  url: string;
  status: 'pending' | 'scraping' | 'completed' | 'failed' | 'blocked';
  found: number;
  new: number;
  duration_ms: number;
  error?: string;
  retry_count?: number;
}
```

**Functions:**
- `createInitialPageStats(maxPages, startPage)` → מערך PageStat ראשוני
- `updatePageStatus(supabase, runId, page, updates)` → עדכון דף ספציפי
- `incrementRunStats(supabase, runId, found, newCount)` → Atomic increment (RPC)
- `isRunStopped(supabase, runId)` → בדיקת עצירה
- `checkAndFinalizeRun(supabase, runId, maxPages, source)` → **הלוגיקה המרכזית:**

**checkAndFinalizeRun - לוגיקה:**
1. בדיקת דפים תקועים ב-'scraping' → mark failed
2. **Broken chain detection**: דפים pending, אף דף לא scraping, ריצה > 2 דקות → mark failed
3. אם לא כולם סיימו → return (ממשיכים לחכות)
4. בדיקת דפים failed עם retry_count < 2 → trigger retry:
   - **parallel** (homeless): trigger כל דף בנפרד
   - **sequential** (yad2/madlan): chain retries ברצף
5. אם אין retries → finalize:
   - `status = 'partial'` (אם יש errors) או `'completed'`
   - עדכון `scout_configs.last_run_*`

### 7.2 `_shared/settings.ts`

**מבנה ScoutSettings:**
```typescript
interface ScoutSettings {
  duplicates: { price_diff_threshold, size_diff_threshold, ... };
  matching: { min_score, max_matches_per_property, ... };
  scraping: { yad2_pages, madlan_pages, homeless_pages, ... };
  availability: { batch_size, daily_limit, schedule_end_time, ... };
  backfill: { schedule_end_time };
}
```

**Functions:**
- `fetchScoutSettings(supabase)` → כל ההגדרות
- `fetchCategorySettings(supabase, category)` → הגדרות לקטגוריה ספציפית
- `isPastEndTime(endTimeIL)` → האם עבר שעת הסיום (Israel Time)

### 7.3 `_shared/process-flags.ts`

```typescript
async function isProcessEnabled(supabase, processName): Promise<boolean> {
  const flagName = `process_${processName}`;
  const { data } = await supabase.from('feature_flags')
    .select('is_enabled').eq('name', flagName).maybeSingle();
  return data?.is_enabled ?? true; // default: enabled
}
```

### 7.4 `_shared/availability-indicators.ts`

**אינדיקטורים להסרת מודעה:**
```typescript
// Yad2
'חיפשנו בכל מקום אבל אין לנו עמוד כזה'
'העמוד שחיפשת הוסר'

// Madlan
'המודעה הוסרה'

// Homeless
'נראה שעסקה זו כבר נסגרה'
```

**isMadlanHomepage:** בודק נוכחות של "חיפושים פופולריים" **ו**היעדר של תוכן מודעה ("דירה להשכרה:", "פנטהאוז למכירה:", etc.)

### 7.5 `_shared/url-builders.ts`

**City mappings:**

| אתר | Format | דוגמה |
|-----|--------|-------|
| Yad2 | topArea/area/city numeric | `topArea=2&area=1&city=5000` |
| Madlan | Hebrew slug | `תל-אביב-יפו-ישראל` |
| Homeless | region,area,city | `17,1,150` |

**buildSinglePageUrl(config, page):**
- יד2: `https://www.yad2.co.il/realestate/rent?topArea=2&...&page=2`
- מדלן: `https://www.madlan.co.il/for-rent/תל-אביב-יפו-ישראל?page=2`
- הומלס: `https://www.homeless.co.il/rent/?inumber1=17,1,150&page=2`

**חשוב:** תמיד כולל `?page=1` גם בדף ראשון (בלי זה Jina מחזיר תוכן חלקי).

### 7.6 `_shared/scraping.ts`

**validateScrapedContent(markdown, html, source):**
- Minimum length check (500 chars markdown / 1000 chars html)
- Block indicators: captcha, access denied, rate limit, cloudflare challenge
- Source-specific: Madlan/Yad2 חייבים מחוונים של מודעות (₪, חדרים)

### 7.7 `_shared/property-helpers.ts` (508 שורות)

**Functions:**
- `extractListingId(url, source)` → מזהה מודעה מ-URL
- `normalizeSourceUrl(url, source)` → URL נקי (בלי tracking params)
- `saveProperty(supabase, property)` → שמירת נכס (upsert on source_id)

### 7.8 `_shared/broker-detection.ts` (272 שורות)

**Functions:**
- `isInvalidAddress(address)` → בדיקת כתובות לא תקינות (שמות מתווכים)
- `normalizeCityName(city)` → נירמול שם עיר
- `detectBrokerFromMarkdown(markdown, source)` → זיהוי מתווך/פרטי

### 7.9 `_shared/neighborhood-codes.ts` (350 שורות)

מיפוי שכונות לקודים ספציפיים לכל אתר:
- `getYad2NeighborhoodCodes(neighborhoods)` → קודים מספריים
- `getMadlanNeighborhoodSlug(neighborhood, city)` → slug עברי
- `getMadlanMultiNeighborhoodPath(neighborhoods, city)` → multiple slugs
- `getHomelessAreaCodes(neighborhoods)` → area codes

---

## 8. Headers לכל פונקציה

| פונקציה | Accept | X-No-Cache | X-Proxy-Country | X-Wait-For-Selector | X-Return-Format | X-Timeout | X-Locale |
|---------|--------|-----------|----------------|--------------------|----|---------|---------|
| scout-homeless-jina | text/html | ✅ | ❌ | body | html | 30 | he-IL |
| scout-yad2-jina | text/markdown | ✅ | IL | `a[href*="/realestate/item/"]` | - | 30 | he-IL |
| scout-madlan-jina | text/markdown | ❌ | ❌ | body | - | 30 | he-IL |
| backfill-jina | text/markdown | ✅ | ❌ | body | - | 35 | - |
| availability (non-madlan) | text/markdown | ✅ | ❌ | body | - | 35 | - |
| availability (madlan ph1) | text/markdown | ❌ | IL | body | - | 35 | - |
| availability (madlan ph2) | text/markdown | ✅ | IL | body | - | 35 | - |

**הערה חשובה:** אף פונקציה לא שולחת `Authorization` header - זה Free Tier בלבד.

---

## 9. תזמון ולוחות זמנים (Israel Time)

| חלון | תהליך | קובץ |
|------|--------|------|
| 00:00 - 02:30 | השלמת נתונים (Backfill) | backfill-property-data-jina |
| 03:00 - 04:30 | זיהוי כפילויות | detect-duplicates |
| 05:00 - 06:30 | בדיקת זמינות | trigger-availability-check-jina |
| 07:00 - 08:30 | התאמות ללקוחות | trigger-matching |
| 23:00 | סריקות | trigger-scout-all-jina |

כל תהליך עוצר self-chain כש-`isPastEndTime(schedule_end_time)` מחזיר `true`.

---

## 10. Kill Switches

| Flag Name | תהליך | ברירת מחדל |
|-----------|--------|-----------|
| process_scans_jina | סריקות 2 | enabled |
| process_backfill_jina | השלמת נתונים 2 | enabled |
| process_availability | בדיקת זמינות (שתי הגרסאות) | enabled |

**לוגיקה:** אם הדגל לא קיים בטבלה → default enabled.

---

## 11. סיכום קבצים

| קובץ | שורות | תפקיד |
|------|-------|-------|
| `trigger-scout-all-jina/index.ts` | 107 | Cron entry - מפעיל configs מתוזמנים |
| `trigger-scout-pages-jina/index.ts` | 137 | יצירת run + trigger דפים |
| `scout-homeless-jina/index.ts` | 162 | סורק homeless (HTML, parallel) |
| `scout-yad2-jina/index.ts` | 299 | סורק yad2 (markdown, sequential + retry) |
| `scout-madlan-jina/index.ts` | 293 | סורק madlan (markdown, sequential) |
| `backfill-property-data-jina/index.ts` | 1,187 | השלמת נתונים + self-chain |
| `trigger-availability-check-jina/index.ts` | 344 | orchestrator + batching + self-chain |
| `check-property-availability-jina/index.ts` | 418 | בדיקת זמינות per-batch |
| `_shared/run-helpers.ts` | 309 | ניהול ריצות, retries, finalization |
| `_shared/settings.ts` | 257 | הגדרות מ-DB |
| `_shared/process-flags.ts` | 38 | kill switches |
| `_shared/url-builders.ts` | 393 | בניית URLs |
| `_shared/scraping.ts` | 363 | validation + content cleaning |
| `_shared/property-helpers.ts` | 508 | שמירת נכסים |
| `_shared/broker-detection.ts` | 272 | זיהוי מתווכים |
| `_shared/availability-indicators.ts` | 85 | אינדיקטורים להסרה |
| `_shared/neighborhood-codes.ts` | 350 | מיפוי שכונות |

**סה"כ: ~4,922 שורות קוד**

---

> עדכון אחרון: 22/02/2026
