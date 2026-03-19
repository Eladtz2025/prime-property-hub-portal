

## שדרוג המוניטור — 3 תיקונים

### 1. מרכוז הטאבים בשורת הכותרת
הטאבים כרגע צמודים לשאר האלמנטים ב-flex. נעטוף אותם ב-div עם `flex-1 flex justify-center` כדי למרכז אותם.

### 2. תיקון באג ב-dailyRunsHealth — מציג 1/4 במקום 3/4 או 4/4
**שורש הבעיה**: השאילתה של `backfillRuns` מסננת `status = 'running'` בלבד. ברגע שריצה מסתיימת היא לא נכללת ב-`backfillRuns`, ולכן `dailyRunsHealth` לא רואה אותה.

**תיקון**: הוספת שאילתה חדשה `completedBackfillToday` שמושכת ריצות `completed` מ-`backfill_progress` מהיום. ה-`dailyRunsHealth` ישתמש בשתי המקורות — `backfillRuns` (running) + `completedBackfillToday` (completed) — כדי לבדוק אם data_completion ו-dedup רצו היום.

### 3. מטריקה חדשה: "סריקות אתמול"
**ההבדל**: "ריצות יומיות" = 4 התהליכים (השלמה, כפילויות, זמינות, התאמות). "סריקות" = סריקות אתרים לנכסים חדשים (scout_runs) — שרצות בערב (~23:00).

**לוגיקה**: שאילתה חדשה שמביאה scout_runs מאתמול, מקובצים לפי source. לכל source נבדוק: האם הריצה הצליחה, כמה נכסים נמצאו. מוצג כמטריקה עם tooltip שמפרט כל source וסטטוס.

### שינויים טכניים

**`useMonitorData.ts`**:
- שאילתה חדשה `completedBackfillToday` — `backfill_progress` עם `status in (completed)` מהיום
- שאילתה חדשה `yesterdayScans` — `scout_runs` מאתמול
- עדכון `dailyRunsHealth` להשתמש גם ב-`completedBackfillToday`
- memo חדש `yesterdayScansHealth` — `{ passed, total, details[] }`
- החזרת `yesterdayScansHealth` מה-hook

**`LiveMonitor.tsx`**:
- מרכוז טאבים בשורת הכותרת
- הוספת מטריקת "סריקות אתמול" עם tooltip דומה לריצות יומיות

