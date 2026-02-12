
# הוספת אפשרות שינוי זמני ריצה ל-4 תהליכים

## מה משתנה

לכל אחד מ-4 התהליכים (כפילויות, בדיקת זמינות, השלמת נתונים, התאמות) יתווסף כפתור "הגדרות" שפותח דיאלוג קטן עם אפשרות לשנות את שעת הריצה. כשהמשתמש משנה שעה — גם ההגדרה ב-DB וגם ה-cron job מתעדכנים.

## הגישה

1. **יצירת RPC בדאטאבייס** — פונקציית `update_cron_schedule` שמקבלת שם job וזמן cron חדש, ומעדכנת את `cron.job`.
2. **הוספת הגדרות schedule_times ב-scout_settings** — לכפילויות ולבדיקת זמינות (חסרות כרגע).
3. **קומפוננטת עריכת זמנים** — קומפוננטה קטנה `ScheduleTimeEditor` שמציגה את השעה הנוכחית ומאפשרת לשנות אותה, ואז שומרת ל-scout_settings + מעדכנת את ה-cron.
4. **חיבור ל-ProcessCards** — הוספת `settingsContent` לכל אחד מ-4 הכרטיסים.

## פרטים טכניים

### 1. מיגרציית SQL

**הוספת RPC:**
```text
CREATE OR REPLACE FUNCTION update_cron_schedule(job_name TEXT, new_schedule TEXT)
RETURNS void AS $$
  UPDATE cron.job SET schedule = new_schedule WHERE jobname = job_name;
$$ LANGUAGE sql SECURITY DEFINER;
```

**הוספת הגדרות חסרות:**
```text
INSERT INTO scout_settings (category, setting_key, setting_value, description)
VALUES 
  ('duplicates', 'schedule_times', '["00:00"]', 'שעות ריצת ניקוי כפילויות (ישראל)'),
  ('availability', 'schedule_times', '["05:00"]', 'שעות ריצת בדיקת זמינות (ישראל)');
```

### 2. קומפוננטה חדשה: `ScheduleTimeEditor`

קובץ: `src/components/scout/checks/ScheduleTimeEditor.tsx`

קומפוננטה שמקבלת:
- `category` — קטגוריה ב-scout_settings (duplicates/availability/backfill/matching)
- `cronJobName` — שם ה-cron job (cleanup-orphan-duplicates-hourly / availability-check-continuous / backfill-data-completion-job / match-leads-job)
- `ilToUtcOffset` — הפרש שעות ישראל-UTC (כרגע 2)

מציגה: שעה נוכחית (מ-scout_settings), שדה עריכה, כפתור שמירה.
בשמירה: מעדכנת scout_settings + קוראת ל-RPC `update_cron_schedule` עם ה-cron החדש.

### 3. מיפוי שעות לביטויי cron

| תהליך | cron job name | המרת שעה IL לcron |
|--------|---------------|-------------------|
| כפילויות | cleanup-orphan-duplicates-hourly | `0 {IL-2} * * *` |
| בדיקת זמינות | availability-check-continuous | `0 {IL-2} * * *` |
| השלמת נתונים | backfill-data-completion-job | `0 {IL-2} * * *` |
| התאמות | match-leads-job | `0 {IL-2} * * *` |

### 4. שינויים ב-ChecksDashboard.tsx

הוספת `settingsContent={<ScheduleTimeEditor ... />}` ל-4 הכרטיסים:

- **כפילויות** (שורה 259): `settingsContent={<ScheduleTimeEditor category="duplicates" cronJobName="cleanup-orphan-duplicates-hourly" />}`
- **בדיקת זמינות** (שורה 238): ה-settingsContent הקיים (`AvailabilitySettingsContent`) ישולב עם `ScheduleTimeEditor` — נעטוף שניהם ב-div
- **השלמת נתונים** (שורה 294): `settingsContent={<ScheduleTimeEditor category="backfill" cronJobName="backfill-data-completion-job" />}`
- **התאמות** (שורה 276): `settingsContent={<ScheduleTimeEditor category="matching" cronJobName="match-leads-job" />}`

### 5. עדכון useScoutSettings

הוספת `schedule_times` לממשק של `duplicates` ו-`availability` ב-`useScoutSettings.ts`.

### 6. עדכון ScheduleSummaryCard

במקום hardcode של שעות כפילויות ובדיקת זמינות — לקרוא מ-scout_settings כמו שכבר קורה עם backfill ו-matching.

### קבצים שישתנו:
- **SQL migration** — RPC + שורות חדשות ב-scout_settings
- `src/components/scout/checks/ScheduleTimeEditor.tsx` (חדש)
- `src/components/scout/ChecksDashboard.tsx`
- `src/hooks/useScoutSettings.ts`
- `src/components/scout/ScheduleSummaryCard.tsx`
