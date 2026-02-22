

# Add `X-Proxy-Country: IL` to Madlan Jina Scraping

## What's Happening

Madlan is blocking Jina requests with a CAPTCHA (902 chars, classification: captcha). The Availability checker already uses `X-Proxy-Country: IL` for Madlan and it works. Scout and Backfill are missing this header.

## Changes

### 1. `supabase/functions/scout-madlan-jina/index.ts` (line ~38)
Add `'X-Proxy-Country': 'IL'` to the headers object, right after `X-Locale`.

### 2. `supabase/functions/backfill-property-data-jina/index.ts` (line ~442)
Add `'X-Proxy-Country': 'IL'` to jinaHeaders when `isMadlanProp` is true (in the existing Madlan-specific block).

### 3. `supabase/functions/check-property-availability-jina/index.ts`
No change needed -- already has `X-Proxy-Country: IL` for Madlan (line 62).

## No changes to Yad2 or Homeless

The proxy header is added only inside Madlan-specific code paths.

## Testing

After deploy, run a Madlan scout from the admin dashboard. Check edge function logs -- classification should change from `captcha` to `ok` and listings should be parsed.

