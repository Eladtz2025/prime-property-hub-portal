

## Problem

The `MADLAN_BLOCK_INDICATORS` array (line 34-43 in `availability-indicators.ts`) contains two overly broad strings:
- `"enable JavaScript"` — appears in every Madlan page inside `<noscript>` tags (standard React/Next.js)
- `"Cloudflare"` — appears in every Madlan page as CDN references

Since `isMadlanBlocked()` checks if **any** indicator appears in the HTML, every Madlan listing gets flagged as `madlan_blocked_retry`.

The same issue exists in `madlan-observability.ts` (`MADLAN_BLOCK_PHRASES` array) which also contains `"enable JavaScript"` and `"Cloudflare"`.

## Fix

**File 1: `supabase/functions/_shared/availability-indicators.ts`** (lines 34-43)

Remove `"enable JavaScript"` and `"Cloudflare"` from `MADLAN_BLOCK_INDICATORS`. Keep the other 6 indicators which are specific to actual CAPTCHA/block pages:
- `סליחה על ההפרעה`
- `משהו בדפדפן שלך גרם לנו לחשוב שאתה רובוט`
- `אנא השלם את החידה שלפניך`
- `Checking your browser`
- `Access denied`
- `error 403`

**File 2: `supabase/functions/_shared/madlan-observability.ts`** (lines 26-35)

Same fix — remove `"enable JavaScript"` and `"Cloudflare"` from `MADLAN_BLOCK_PHRASES`.

## What's NOT changing
- Removal detection logic (title, og:description, og:title, 410/404) — untouched
- Yad2/Homeless detection — untouched
- All other availability check logic — untouched

## After deploy
- Redeploy `check-property-availability-jina`
- The 58 properties stuck on `madlan_blocked_retry` will be rechecked automatically on next availability run

