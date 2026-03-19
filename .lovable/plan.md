

## תיקון בדיקות כפולות — שרשור מקבילי יוצר chains כפולים

### הבעיה

מצאתי את שורש הבאג. כשה-trigger עושה self-chain ומקבל 504 (timeout מצד הקורא, אבל הפונקציה החדשה כבר רצה), הוא עושה retry ויוצר **chain נוסף מקבילי**. מהלוגים רואים `"Self-chain response 504, retrying in 3s..."` ואז גם `"Self-chain succeeded"` וגם `"Self-chain retry succeeded"` — כלומר **שני chains רצים במקביל** על אותו run.

שני ה-chains קוראים ל-RPC באותו זמן ומושכים את **אותם נכסים** כי ה-`availability_checked_at` עדיין לא עודכן. לכן "מבצע קדש" מופיע 3 פעמים (chain A + chain B + chain C שנוצר מ-retry נוסף), ובר גיורא 14 שהוא retryable מופיע 7 פעמים.

ההוכחה: אותו property_id נבדק בהפרש של ~15 שניות (שתי בדיקות מקביליות של 2 chains שונים).

### תיקון

**קובץ: `supabase/functions/trigger-availability-check-jina/index.ts`**

שינוי ב-`selfChainWithRetry`: לפני ה-retry, לבדוק את ה-heartbeat של ה-run. אם ה-`started_at` (heartbeat) עודכן לאחרונה (פחות מ-30 שניות), סימן שה-chain הראשון כבר עובד — לא צריך retry.

```
// Before retry, check if the chain is already running (heartbeat updated)
const { data: runData } = await supabase
  .from('availability_check_runs')
  .select('started_at')
  .eq('id', runId)
  .single();

const heartbeatAge = Date.now() - new Date(runData.started_at).getTime();
if (heartbeatAge < 30000) {
  console.log('✅ Chain already running (heartbeat fresh), skipping retry');
  return;
}
```

זה מונע יצירת chains כפולים כשה-504 הוא false alarm (הפונקציה רצה אבל הקורא קיבל timeout).

### שינוי אחד בקובץ אחד

- **`trigger-availability-check-jina/index.ts`** — עדכון `selfChainWithRetry` עם בדיקת heartbeat לפני retry

