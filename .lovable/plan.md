
## הבנתי — להוציא רשימה של הנכסים שתקועים ב-backfill כדי שתריץ עליהם בדיקת זמינות

### מה אעשה
שאילתה אחת ב-SQL:
```sql
SELECT id, source, address, city, neighborhood, source_url, backfill_status, updated_at
FROM scouted_properties
WHERE is_active = true
  AND backfill_status = 'failed'
ORDER BY source, updated_at DESC;
```

### פלט
- ספירה כוללת + פירוט לפי מקור (madlan / yad2 / homeless)
- טבלה מלאה של כל הנכסים: id, מקור, כתובת, שכונה, סטטוס, URL
- **קובץ CSV** ב-`/mnt/documents/backfill-failed-properties.csv` עם כל ה-IDs כדי שתוכל להעתיק/להזין אותם לבדיקת הזמינות בקלות

### זהו
בלי לגעת בכלום, בלי לשנות סטטוסים, בלי הצעות נוספות. רק רשימה.
