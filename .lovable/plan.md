

# תוכנית: הוספת Cron יומי + בדיקת סטטיסטיקות

## סיכום מה שמצאתי

### המערכת עובדת - תיווך כלול! ✅
הפרסר **לא מסנן** נכסי תיווך - הוא רק מסמן אותם:
```typescript
is_private: !isBroker  // false = תיווך, true = פרטי
```

### סטטיסטיקות מהריצה
| מדד | ערך |
|-----|-----|
| לקוחות eligible | 35 |
| לקוחות עם matches | 2 (Eli Aviad, Ziv Yogev) |
| סטטוס ריצה | running |

### דוגמה מהלוגים
```text
בנדתה:
- madlan page 3: Input 31, Passed 9
- Rejection: price_too_high(16), too_few_rooms(4), too_many_rooms(2)
- homeless page 1: Input 45, Passed 0
- Rejection: price_too_high(43), wrong_neighborhood(1)
```

### למה רוני עדיין לא נסרק?
הריצה מעבדת 35 לקוחות ברצף עם 5 שניות delay בין כל אחד + 9 דפים לכל אחד (3 דפים × 3 אתרים). רוני כנראה נמצא מאוחר בתור.

---

## מה אעשה

### 1. הוספת Cron יומי ב-01:00 IST (23:00 UTC)
אריץ את ה-SQL הבא דרך הכלי:

```sql
SELECT cron.schedule(
  'personal-scout-daily',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jswumsdymlooeobrxict.supabase.co/functions/v1/personal-scout-trigger',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### 2. הרצת בדיקה ספציפית לרוני
אפעיל ידנית את ה-worker רק עבור רוני לראות מה קורה:

```bash
curl -X POST \
  https://jswumsdymlooeobrxict.supabase.co/functions/v1/personal-scout-worker \
  -d '{"lead_id": "6b95f5af-fa94-47a2-87f7-e0c17934b91b"}'
```

---

## מידע שייאסף עבור כל לקוח

המערכת כבר אוספת סטטיסטיקות מלאות בלוגים:

| שדה | מקור |
|-----|------|
| דפים שנסרקו per source | `stats.by_source[source].scraped` |
| נכסים שנפרסו per source | `stats.by_source[source].parsed` |
| התאמות per source | `stats.by_source[source].matched` |
| סיבות סינון | `filter_reasons` |

### דוגמה מהתוצאה JSON:
```json
{
  "stats": {
    "total_scraped": 9,
    "total_parsed": 180,
    "total_filtered": 25,
    "by_source": {
      "yad2": { "scraped": 3, "parsed": 60, "matched": 8 },
      "madlan": { "scraped": 3, "parsed": 80, "matched": 12 },
      "homeless": { "scraped": 3, "parsed": 40, "matched": 5 }
    }
  }
}
```

---

## שלבי ביצוע

1. **הוספת Cron** - SQL לתזמון יומי
2. **בדיקת רוני** - הרצה ידנית עם הפרמטרים שלו
3. **אופציונלי**: הוספת שמירת stats לטבלה לצפייה בהיסטוריה

