

## Investigation: Arlozorov 17 — Inactive Properties Showing in Dedup Groups

### Findings

I queried the database for all properties at "ארלוזורוב 17". The duplicate group `9d69f03f` contains **6 properties, ALL with `is_active = true`**. The code correctly filters by `is_active = true` (line 101), so the issue is **not a display bug** — it's a **data issue**: properties that should be inactive are still marked as active.

**The 6 properties in the group:**

| # | Source | Rooms | Price | URL ID | availability_check_reason |
|---|--------|-------|-------|--------|---------------------------|
| 1 | madlan | 3.0 | 23,000 | QCzULSlW4fm | null (unchecked) |
| 2 | madlan | 2.5 | 24,000 | 3BQqogDu770 | no_indicators_keeping_active |
| 3 | yad2 | 3.0 | 24,000 | **7zaubz5e** (with params) | content_ok |
| 4 | yad2 | 2.5 | 24,000 | hng16rna | content_ok |
| 5 | yad2 | 3.0 | 23,000 | **7zaubz5e** (no params) | content_ok |
| 6 | madlan | 2.5 | 24,500 | tcKZQKtLlIN | null (unchecked) |

**Also found separately** (not in the group, already `is_active = false`):
- `tel-aviv-area/7zaubz5e` — same yad2 listing, detected as removed

### Root Causes

**Problem 1: URL Duplicates Not Caught**
Properties #3 and #5 point to the **exact same yad2 listing** (`7zaubz5e`) but with different URL formats. One variant (`tel-aviv-area/7zaubz5e`) was already deactivated. The scraper is inserting the same listing multiple times with different URL formats, and the dedup/ingest logic doesn't normalize yad2 item IDs.

**Problem 2: Availability Check Passing Dead Listings**
Some of these may have been removed from the source site but passed the availability check with `content_ok` — possibly because the yad2 page returns generic content even for removed listings when accessed with certain URL formats.

**Problem 3: Losers Count Includes Inactive**
The losers count query (line 82 in `DeduplicationStatus.tsx`) doesn't filter by `is_active`, inflating the number.

### Proposed Fixes

**1. Add URL normalization for yad2 during ingest** (SQL + edge function)
- Extract the yad2 item ID (e.g., `7zaubz5e`) and strip query params and `tel-aviv-area/` prefix
- Before inserting, check if a property with the same normalized yad2 ID already exists
- This prevents URL duplicates at the source

**2. Fix losers count** (`DeduplicationStatus.tsx`, line 82)
- Add `.eq('is_active', true)` to the losers count query

**3. Clean existing URL duplicates** (one-time SQL)
- Find yad2 properties that share the same item ID but have different URLs
- Keep the one with the simplest URL, deactivate the rest

### Summary of Changes

| File/Location | Change |
|---|---|
| `DeduplicationStatus.tsx` line 82 | Add `is_active` filter to losers count |
| Edge function (ingest) | Normalize yad2 URLs before insert to prevent duplicates |
| One-time SQL cleanup | Deactivate yad2 URL duplicates |

