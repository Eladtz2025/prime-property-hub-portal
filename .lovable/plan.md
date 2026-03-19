

## תוכנית: נכסים עם שגיאות חוזרים מיד לתור

### הבעיה
כרגע, כשנכס מקבל שגיאה (403, timeout, blocked וכו'), המערכת מעדכנת את `availability_checked_at` לזמן הנוכחי. זה דוחף אותו 2 ימים אחורה בתור — למרות שהוא לא באמת נבדק.

### הפתרון

**שינוי 1: לוגיקה ב-`check-property-availability-jina/index.ts` (שורות 408-431)**

כשתוצאה היא retryable (timeout, 403, blocked, error וכו'):
- **לא** לעדכן את `availability_checked_at`
- **כן** לעדכן את `availability_check_reason` (כדי לראות בלוגים מה קרה)
- **לא** להגדיל את `availability_check_count`

כך הנכס נשאר בתור עם ה-`availability_checked_at` הישן שלו, ויתבדק שוב בריצה הבאה (או בסוף התור הנוכחי אם יש עוד מקום).

הסיבות שנחשבות retryable (כבר מוגדרות בקוד):
- `per_property_timeout`
- `check_error`
- `rate_limited`
- `madlan_blocked_retry`
- `short_content_keeping_active`
- `jina_failed_after_retries`
- וגם סטטוסים כמו `madlan_direct_status_403`, `madlan_direct_status_520`

**שינוי 2: הוספת סטטוסי Madlan לרשימת ה-retryable**

כרגע `madlan_direct_status_403` ו-`madlan_direct_status_520` לא ברשימת `retryableReasons`. צריך להוסיף אותם, או ליצור לוגיקה שתופסת כל `madlan_direct_status_*` שאינו תקין.

**שינוי 3: איפוס 921 נכסים שנכשלו היום**

הרצת UPDATE על ה-DB שמאפסת את `availability_checked_at` ל-NULL עבור נכסים שקיבלו היום שגיאות (403, 520, timeout, blocked) — כדי שייבדקו מחדש מיד בריצה הבאה.

```sql
UPDATE scouted_properties
SET availability_checked_at = NULL,
    availability_check_reason = NULL
WHERE availability_checked_at >= '2025-03-19'
  AND is_active = true
  AND availability_check_reason IN (
    'madlan_direct_status_403',
    'madlan_direct_status_520', 
    'per_property_timeout',
    'check_error',
    'rate_limited',
    'madlan_blocked_retry'
  );
```

### סיכום
- נכס שנבדק בהצלחה (content_ok / listing_removed) → מתעדכן כרגיל
- נכס שקיבל שגיאה → חוזר מיד לסוף התור בלי המתנה של יומיים
- 921 נכסים שנכשלו היום → מתאפסים ונכנסים מחדש לתור

