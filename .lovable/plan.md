
## איפוס availability_checked_at ל-92 הנכסים

### מה אעשה
מיגרציה אחת:
```sql
UPDATE scouted_properties
SET availability_checked_at = NULL,
    availability_check_reason = NULL
WHERE is_active = true
  AND backfill_status = 'failed';
```

### תוצאה
92 הנכסים יחזרו להיחשב "ממתינים לבדיקה" ויופיעו בתור הרגיל של בדיקת זמינות, ותוכל להריץ אותם מה-UI.

### לא נוגע
לא ב-`is_active`, לא ב-`status`, לא ב-`availability_check_count`, לא בלוגיקה — רק איפוס שני שדות כדי שייכנסו לתור.
