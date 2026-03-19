

## בדיקה מחדש של כל נכסי מדל"ן הפעילים

### מה נעשה
נאפס את `availability_checked_at` לכל נכסי מדל"ן הפעילים שסומנו `content_ok` היום (לפני התיקון), כך שייכנסו מחדש לתור הבדיקה עם הלוגיקה החדשה (Strategy 5).

### שלבים
1. **איפוס** — הרצת UPDATE על `scouted_properties` שמאפס `availability_checked_at` ו-`availability_check_reason` לנכסי מדל"ן פעילים שנבדקו היום עם `content_ok`
2. **הפעלת ריצה ידנית** — קריאה ל-`trigger-availability-check-jina` עם `manual: true` כדי שהמערכת תתחיל לעבד את הנכסים המאופסים

### פרטים טכניים
```sql
UPDATE scouted_properties
SET availability_checked_at = NULL,
    availability_check_reason = NULL,
    availability_check_count = GREATEST(availability_check_count - 1, 0)
WHERE source = 'madlan'
  AND is_active = true
  AND availability_check_reason = 'content_ok'
  AND availability_checked_at >= '2025-03-19'::date;
```

אחרי האיפוס, הריצה הידנית תעבד את כל ~1,271 הנכסים בבאצ'ים של 10 עם self-chaining אוטומטי.

