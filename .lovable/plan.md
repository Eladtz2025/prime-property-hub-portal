
# Fix: Cron Job for Property Scans Not Running

## The Problem

The scheduled scans are **not running automatically** because of two misconfigurations:

1. **Wrong function name**: The Cron job calls `trigger-scout-all` but the actual deployed function is `trigger-scout-all-jina`
2. **Wrong schedule hour**: The Cron runs at `*/5 21 * * *` (every 5 min during 21:00 UTC = 00:00 Israel time), but all configs are scheduled for 23:XX Israel time (= 20:XX UTC in winter, 20:XX UTC in summer)

## The Fix

Update the Cron job using the existing `update_cron_schedule` RPC to:
- Point to `trigger-scout-all-jina` instead of `trigger-scout-all`
- Change schedule to `*/5 20 * * *` (every 5 min during 20:00 UTC = 23:00 Israel time in summer, or adjust as needed)

### Technical Details

Run this SQL via the `update_cron_schedule` RPC:

```text
Job name:  scout-properties-job
Schedule:  */5 20 * * *
Command:   UPDATE to call trigger-scout-all-jina URL
```

The command will be updated to:
```sql
SELECT net.http_post(
  url := '<supabase_url>/functions/v1/trigger-scout-all-jina',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer <anon_key>'
  ),
  body := '{}'::jsonb
);
```

### Important Note on Timezone

Israel switches between UTC+2 (winter) and UTC+3 (summer). Currently (February) Israel is UTC+2, so 23:00 Israel = 21:00 UTC. The Cron schedule should be `*/5 21 * * *` for winter. However, in summer it shifts to `*/5 20 * * *`.

**Option A (simple):** Set to `*/5 20-21 * * *` to cover both summer and winter (runs for 2 hours but configs only match at their exact time).

**Option B (exact):** Set to `*/5 21 * * *` now and adjust manually at DST transitions.

### Files Changed

1. No code file changes needed -- only a Cron job update via `update_cron_schedule` RPC

### Steps

1. Call `update_cron_schedule` RPC to fix the job name and schedule
2. Verify by checking `cron.job` table that the URL now points to `trigger-scout-all-jina`
3. Wait for 23:00 Israel time and check edge function logs to confirm scans trigger
