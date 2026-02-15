

# הוספת בדיקת שעת סיום ל-detect-duplicates ו-trigger-matching

## הבעיה

שני תהליכים לא בודקים את `schedule_end_time` ולכן יכולים לרוץ ללא הגבלת זמן:
- **detect-duplicates** (כפילויות) - אין בדיקת `isPastEndTime`, אין self-chain stop
- **trigger-matching** (התאמות) - אין בדיקת `isPastEndTime`, אין self-chain stop

שלושה תהליכים אחרים כבר בודקים ועובדים נכון:
- backfill-property-data (עוצר ב-02:30)
- reclassify-broker (עוצר ב-02:30 עם אותה הגדרה)
- trigger-availability-check (עוצר ב-06:30)

## מה לגבי backfill אחרי סריקה?

אין טריגר כזה. ה-backfill רץ רק מה-Cron המתוזמן שלו ב-00:00. זה תקין - לא צריך לשנות.

## הפתרון

### שלב 1: עדכון detect-duplicates/index.ts
הוספת `isPastEndTime` ו-`fetchCategorySettings` מ-`_shared/settings.ts`. בסוף כל באצ', לפני self-chain, בדיקה האם עברנו את שעת הסיום (04:30 ברירת מחדל). אם כן - עצירה.

### שלב 2: עדכון trigger-matching/index.ts
אותו דבר - הוספת בדיקת `isPastEndTime` עם הגדרת `schedule_end_time` מקטגוריית matching (08:30 ברירת מחדל). אם עברנו את השעה - עצירה.

### שלב 3: תיקון default schedule_times ב-matching
ערכי ברירת המחדל `['09:15', '18:15']` כבר לא רלוונטיים (ההתאמות לא בודקות schedule_times פנימית). נעדכן ל-`['07:00']` לעקביות בתצוגת ה-UI.

## פרטים טכניים

### detect-duplicates - שינוי בסוף הפונקציה
```typescript
import { fetchCategorySettings, isPastEndTime } from '../_shared/settings.ts';

// After batch processing, before self-chain:
let endTimeReached = false;
try {
  const dedupSettings = await fetchCategorySettings(supabase, 'duplicates');
  endTimeReached = isPastEndTime(dedupSettings.schedule_end_time);
} catch (e) {
  console.warn('Failed to check end time:', e);
}

if (endTimeReached) {
  // Update status to stopped, don't self-chain
}
```

### trigger-matching - שינוי דומה
```typescript
import { isPastEndTime } from '../_shared/settings.ts';
// fetchCategorySettings already imported

// Before self-chain decision:
let endTimeReached = false;
try {
  const matchSettings = await fetchCategorySettings(supabase, 'matching');
  endTimeReached = isPastEndTime(matchSettings.schedule_end_time);
} catch (e) {
  console.warn('Failed to check end time:', e);
}
```

## תוצאה צפויה

```text
23:00          Scouts (סריקות)
00:00 - 02:30  Backfill (השלמת נתונים) - כבר עובד
03:00 - 04:30  Duplicates (כפילויות) - יתוקן
05:00 - 06:30  Availability (זמינות) - כבר עובד
07:00 - 08:30  Matching (התאמות) - יתוקן
```

כל התהליכים יעצרו אוטומטית בשעת הסיום שלהם.
