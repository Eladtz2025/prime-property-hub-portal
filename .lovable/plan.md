
# תיקון ריצות תקועות — שינוי אחד פשוט

## הבעיה בקצרה

כשסריקה קורסת באמצע (CAPTCHA, timeout), שרשרת העמודים נשברת. אף פונקציה לא נשארת חיה כדי לסגור את הריצה, והיא נשארת בסטטוס "running" לנצח. סריקות חדשות נחסמות עם שגיאה 409.

## הפתרון

שינוי אחד בלבד בקובץ `trigger-scout-pages-jina/index.ts` (שורות 60-66):

**לפני:** הפונקציה בודקת אם יש ריצה פעילה וחוסמת מיד.

**אחרי:** הפונקציה בודקת גם כמה זמן הריצה רצה. אם יותר מ-15 דקות — היא כנראה תקועה, אז הפונקציה סוגרת אותה אוטומטית ומתחילה סריקה חדשה.

הלוגיקה:
- ריצה בת פחות מ-15 דקות = עדיין פעילה, מחזיר 409 כרגיל
- ריצה בת יותר מ-15 דקות = תקועה, סוגר אותה כ-"partial" וממשיך

## פרטים טכניים

### קובץ: `supabase/functions/trigger-scout-pages-jina/index.ts`

שורות 60-66 משתנות מ:

```text
const { data: existingRun } = await supabase
  .from('scout_runs').select('id').eq('config_id', config_id).eq('status', 'running').single();
if (existingRun) {
  return new Response(JSON.stringify({ error: 'Config already has a running job', run_id: existingRun.id }), {
    status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

ל:

```text
const { data: existingRun } = await supabase
  .from('scout_runs')
  .select('id, created_at')
  .eq('config_id', config_id)
  .eq('status', 'running')
  .single();

if (existingRun) {
  const runAgeMs = Date.now() - new Date(existingRun.created_at).getTime();
  const STALE_RUN_THRESHOLD_MS = 15 * 60 * 1000; // 15 דקות

  if (runAgeMs > STALE_RUN_THRESHOLD_MS) {
    console.warn(`⚠️ Stale run ${existingRun.id} detected (${Math.round(runAgeMs / 60000)} min old) — auto-closing as partial`);
    await supabase
      .from('scout_runs')
      .update({ status: 'partial', completed_at: new Date().toISOString() })
      .eq('id', existingRun.id);
    // ממשיך ליצור ריצה חדשה...
  } else {
    return new Response(JSON.stringify({
      error: 'Config already has a running job',
      run_id: existingRun.id
    }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
```

### פריסה

- `trigger-scout-pages-jina`

## למה זה הפתרון הכי נכון

- **שינוי אחד, מקום אחד** — קל לתחזוקה ולהבנה
- **לא משנה מה קרה** — לא משנה למה הריצה נתקעה (CAPTCHA, timeout, באג), התיקון עובד
- **בטוח** — לא נוגע בריצות אמיתיות (פחות מ-15 דקות)
- **אוטומטי** — לא צריך יותר לתקן ידנית במסד הנתונים
- **רשת ביטחון** — גם אם `checkAndFinalizeRun` נכשל, הסריקה הבאה תנקה את הריצה התקועה
