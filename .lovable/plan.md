

## Watchdog חכם — רץ כל 5 דקות אבל יוצא מיד אם אין ריצות

### הרעיון
ה-cron job עצמו הוא קל מאוד — הוא רק עושה `SELECT` אחד על `availability_check_runs` לראות אם יש ריצה בסטטוס `running` עם heartbeat ישן מ-5 דקות. אם אין — יוצא מיד (פחות מ-100ms, אפס עלות). רק אם יש ריצה תקועה הוא עושה משהו.

אבל יש גישה אפילו יותר חכמה: **במקום cron חיצוני, לשפר את ה-self-chain עצמו** עם retry מובנה.

### הפתרון המשולב

**שלב 1: Retry מובנה ב-self-chain** (הגנה ראשית)
ב-`trigger-availability-check-jina`, כשה-self-chain HTTP call נכשל — לנסות שוב פעם אחת אחרי 3 שניות. זה יתפוס את רוב המקרים (timeout חד-פעמי, שגיאת רשת זמנית).

**שלב 2: Watchdog cron קל** (רשת ביטחון)
Cron כל 5 דקות שעושה:
1. `SELECT` — יש ריצה `running` עם heartbeat > 5 דק?
2. אם לא → `return` מיד (עלות אפסית)
3. אם כן → קורא ל-`trigger-availability-check-jina` עם `{ "watchdog": true, "run_id": "..." }` להמשיך אותה

### קבצים
1. **`supabase/functions/trigger-availability-check-jina/index.ts`** — הוספת retry ל-self-chain + טיפול בפרמטר `watchdog`
2. **Cron job חדש** — `availability-watchdog` כל 5 דקות

### למה שני השלבים?
- ה-retry יתפוס 95% מהמקרים בלי שום עלות נוספת
- ה-watchdog הוא רק לתרחישים קיצוניים (שני כשלונות רצופים, crash של ה-function) — ורוב הזמן הוא רק SELECT אחד ויציאה

### פרטים טכניים

**Retry ב-self-chain (בתוך trigger-availability-check-jina):**
```text
קוד קיים:
  fetch(triggerUrl, ...) // fire-and-forget

קוד חדש:
  try {
    await fetch(triggerUrl, ...) // await the response
  } catch {
    await sleep(3000)
    try { await fetch(triggerUrl, ...) } catch { /* log and give up */ }
  }
```

**Watchdog Edge Function logic (בתוך אותו trigger):**
```text
if body.watchdog:
  SELECT from availability_check_runs 
    WHERE status='running' AND started_at < now()-5min
  if no stuck run → return "nothing to do"
  else → continue that run (same as self-chain)
```

