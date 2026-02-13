

# הוספת שעת סיום לתהליכים ארוכים

## הרעיון

במקום מנגנון תור מורכב, נוסיף לכל תהליך שדה "שעת סיום" ליד "שעת התחלה". התהליך יתחיל בשעה שנקבעה ויפסיק לשרשר את עצמו כשמגיע לשעת הסיום.

## שינויים

### 1. הוספת הגדרה חדשה `schedule_end_time` לכל קטגוריה

הוספת רשומות חדשות לטבלת `scout_settings`:
- `backfill` / `schedule_end_time` = `"02:30"`
- `duplicates` / `schedule_end_time` = `"04:30"`
- `availability` / `schedule_end_time` = `"06:30"`
- `matching` / `schedule_end_time` = `"08:30"`

### 2. עדכון רכיב `ScheduleTimeEditor`

הוספת שדה input נוסף מסוג `time` לשעת סיום, ליד שעות ההתחלה הקיימות. התצוגה תהיה:

```text
שעות ריצה: 03:00  עד  06:30  [שמור]
```

השדה החדש ישמר ב-`scout_settings` עם `setting_key = 'schedule_end_time'`.

### 3. עדכון ה-hooks והטיפוסים

- `useScoutSettings.ts` -- הוספת `schedule_end_time?: string` לכל קטגוריה רלוונטית (backfill, availability, duplicates, matching)
- `supabase/functions/_shared/settings.ts` -- הוספת ערכי ברירת מחדל

### 4. עדכון Edge Functions שמשרשרים את עצמם

בכל מקום שבודקים `hasMore` לפני self-chain, נוסיף בדיקה:

```text
if (hasMore && !isPastEndTime(endTime)) {
  // trigger next batch
} else if (isPastEndTime(endTime)) {
  // mark as completed - "stopped: end time reached"
}
```

הפונקציות שיעודכנו:
- `backfill-property-data/index.ts` -- שורה 845
- `trigger-availability-check/index.ts` -- שורה 254
- `reclassify-broker/index.ts` -- שורה 616

פונקציית עזר ב-`_shared/settings.ts`:

```text
function isPastEndTime(endTimeIL: string): boolean {
  // המרה לשעון UTC והשוואה לשעה הנוכחית
}
```

### 5. סדר ביצוע

1. Migration להוספת 4 רשומות `schedule_end_time` ב-`scout_settings`
2. עדכון `ScheduleTimeEditor` -- הוספת שדה שעת סיום
3. עדכון `useScoutSettings` ו-`settings.ts` -- טיפוסים + ברירות מחדל
4. עדכון 3 Edge Functions -- בדיקת שעת סיום לפני self-chain

### תוצאה

בהגדרות תראה ליד כל תהליך "משעה X עד שעה Y". אם תהליך עדיין רץ ומגיעה שעת הסיום -- הוא יסיים את הבאטצ' הנוכחי ויעצור, ומה שנשאר ימשיך למחרת.
