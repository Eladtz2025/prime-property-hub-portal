

# Fix: Scout Run Not Finalizing After All Pages Complete

## Problem

Yad2 scout completed all 10 pages successfully (183 properties found, 181 new) but the run stayed in `running` status instead of transitioning to `completed`. The finalization logic in `checkAndFinalizeRun` either timed out or failed silently.

## Root Cause

Two issues contribute to this:

1. **Silent failure in finalization**: The DB update in `checkAndFinalizeRun` (line 272-278 in `run-helpers.ts`) does not check for errors -- if the update fails, the run stays stuck in `running` forever.

2. **Missing source label**: `handleRetryOrFinalize` in `scout-yad2-jina/index.ts` (line 280) passes `'yad2'` instead of `'yad2-jina'` to `checkAndFinalizeRun`. While this doesn't break finalization directly, it causes incorrect function name resolution if retries are needed.

## Changes

### 1. `supabase/functions/_shared/run-helpers.ts` -- Add error logging to finalization

In `checkAndFinalizeRun`, add error checking after the final DB update (around line 272-278):

```
const { error: updateError } = await supabase
  .from('scout_runs')
  .update({ status: finalStatus, completed_at: new Date().toISOString() })
  .eq('id', runId);

if (updateError) {
  console.error(`Failed to finalize run ${runId}:`, updateError);
}
```

Also add error checking after the config update (line 282-293).

### 2. `supabase/functions/scout-yad2-jina/index.ts` -- Fix source label

Line 280: Change `'yad2'` to `'yad2-jina'`:

```
if (!run?.page_stats) { await checkAndFinalizeRun(supabase, runId, maxPages, 'yad2-jina'); return; }
```

### 3. `supabase/functions/_shared/run-helpers.ts` -- Add safety timeout finalization

Add a try/catch wrapper around the entire finalization block in `checkAndFinalizeRun` to prevent silent failures from leaving runs stuck:

```
try {
  // existing finalization logic
} catch (finalizeError) {
  console.error(`Finalization error for run ${runId}:`, finalizeError);
  // Emergency finalization attempt
  await supabase.from('scout_runs')
    .update({ status: 'partial', completed_at: new Date().toISOString(), error_message: 'Finalization error' })
    .eq('id', runId);
}
```

### Functions to Deploy

- `scout-yad2-jina`
- All functions sharing `run-helpers.ts` (the shared file is imported at deploy time)

