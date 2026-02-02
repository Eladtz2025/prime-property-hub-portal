

# תיקון בדיקת לינקים שבורים

## בעיות שזוהו

### 1. שגיאת קומפילציה - משתנה לא מוגדר
בקובץ `trigger-availability-check/index.ts` שורה 132:
```typescript
await sleep(DELAY_BETWEEN_BATCHES_MS);  // ❌ לא מוגדר!
```
צריך להיות:
```typescript
await sleep(availabilitySettings.delay_between_batches_ms);  // ✅
```

### 2. batch_size עדיין 20 במקום 50
המיגרציה הקודמת לא הופעלה או נדרסה. צריך לעדכן שוב.

---

## שינויים נדרשים

### תיקון 1: trigger-availability-check/index.ts
שורה 132 - החלפת המשתנה הלא קיים:
```typescript
// לפני:
await sleep(DELAY_BETWEEN_BATCHES_MS);

// אחרי:
await sleep(availabilitySettings.delay_between_batches_ms || 500);
```

### תיקון 2: עדכון batch_size ל-50
```sql
UPDATE scout_settings 
SET setting_value = '50' 
WHERE category = 'availability' AND setting_key = 'batch_size';
```

---

## אחרי התיקון

להפעיל מחדש את הבדיקה:
```bash
POST /trigger-availability-check
```

זה יריץ את הסריקה על כל 5,879 הנכסים הפעילים.

---

## מעקב

אחרי הפעלה, נוכל לבדוק התקדמות:
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as still_active,
  COUNT(*) FILTER (WHERE status = 'inactive') as marked_inactive
FROM scouted_properties
```

